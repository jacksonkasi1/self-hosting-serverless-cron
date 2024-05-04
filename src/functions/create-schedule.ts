import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import { db, eq } from "@/db";
import { tbl_projects, tbl_schedules } from "@/db/schema/schema";

// ** import functions
import { executeWebhook } from "./execute-webhook";

// ** import utils
import { getNextISO8601FromAWSCron } from "@/utils/time";
import { sanitizeInput } from "@/utils/helper";

// ** import jobs
import { scheduleCronJob } from "@/jobs/schedule-job";

// ** import config
import { env } from "@/config";

// ** import third party
import { v4 as uuidv4 } from "uuid";

interface Project {
  id: number;
  secretKey: string;
}

interface SchedulePayload {
  project_id: number;
  name?: string;
  description?: string;
  cron: string;
  request: {
    body: string;
    headers?: Record<string, string>;
    url: string;
  };
  paused?: boolean;
  immediate_execute?: boolean;
}

export const createSchedule: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  let {
    project_id,
    name = `project_id-${project_id}-${new Date().getTime()}`, // todo: add validation, pattern: [.-_A-Za-z0-9]+
    description,
    cron,
    request,
    paused,
    immediate_execute,
  } = JSON.parse(event.body!) as SchedulePayload;


  const secretKey = event.headers["Secret-Key"];

  if (!project_id || !secretKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "Missing project ID or secret key",
      }),
    };
  }

  try {
    // First, validate the project's secret key
    const project: Project | undefined = await db
      .select({
        id: tbl_projects.id,
        secretKey: tbl_projects.secretKey,
      })
      .from(tbl_projects)
      .where(eq(tbl_projects.id, project_id))
      .execute()
      .then((res) => res[0]);

    if (!project || project.secretKey !== secretKey) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid project ID or secret key",
        }),
      };
    }

    const targetId = uuidv4(); // Generates a unique UUID

    name = sanitizeInput(name); // pattern: [.-_A-Za-z0-9]+

    const { rule_arn } = await scheduleCronJob(
      name,
      `cron(${cron})`,
      env.WORKER_LAMBDA_ARN!,
      JSON.stringify({
        url: request.url,
        payload: request.body,
        headers: request.headers,
      }),
      targetId,
    );

    const scheduled_for = getNextISO8601FromAWSCron(cron);

    // Insert the new schedule into the database
    const newSchedule = await db
      .insert(tbl_schedules)
      .values({
        project_id,
        name,
        description,
        cron_expression: cron,
        request,
        paused,
        scheduled_for: scheduled_for, // next scheduled timestamp
        rule_arn: rule_arn as string,
        target_id: targetId,
      })
      .returning()
      .execute();

    // If not paused && immediate execute, schedule the initial webhook trigger
    if (immediate_execute && !paused) {
      const webhookDetails = JSON.parse(JSON.stringify(request));
      await executeWebhook(webhookDetails);
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Schedule created successfully",
        data: {
          scheduleId: newSchedule[0].id,
          details: newSchedule[0],
        },
      }),
    };
  } catch (error: any) {
    console.error("Error creating schedule:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to create schedule",
        error: error.message,
      }),
    };
  }
};
