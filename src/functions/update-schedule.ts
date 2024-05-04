import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import { db, eq } from "@/db";
import { tbl_projects, tbl_schedules } from "@/db/schema/schema";

// ** import utils
import { sanitizeInput } from "@/utils/helper";
import { getNextISO8601FromAWSCron } from "@/utils/time";

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

interface Request {
  body: string;
  headers?: Record<string, string>;
  url: string;
}

interface ScheduleUpdatePayload {
  project_id: number;
  name?: string;
  description?: string;
  cron: string;
  request?: Request;
  paused?: boolean;
}

// Update schedule handler
export const updateSchedule: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  const scheduleId = parseInt(event.pathParameters!.schedule_id as string);
  const projectId = parseInt(event.pathParameters!.project_id as string);

  let {
    name,
    description,
    cron,
    request,
    paused = false,
  } = JSON.parse(event.body!) as ScheduleUpdatePayload;

  const secretKey = event.headers["Secret-Key"];

  if (!projectId || !secretKey) {
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
      .where(eq(tbl_projects.id, projectId))
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

    // Retrieve existing schedule to get details like name and target ID
    const existingSchedule = await db
      .select({
        schedule_name: tbl_schedules.schedule_name,
        target_id: tbl_schedules.target_id,
        rule_arn: tbl_schedules.rule_arn,
        project_id: tbl_schedules.project_id,
        request: tbl_schedules.request,
      })
      .from(tbl_schedules)
      .where(eq(tbl_schedules.id, scheduleId))
      .execute()
      .then((res) => res[0]);

    if (!existingSchedule) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "Schedule not found" }),
      };
    }

    const jobRequest: Request = request
      ? (request as Request)
      : (existingSchedule.request as Request);

    // Update AWS EventBridge Rule
    const updatedRule = await scheduleCronJob(
      existingSchedule.schedule_name, // no need to change the name
      `cron(${cron})`,
      env.WORKER_LAMBDA_ARN!,
      JSON.stringify({
        url: jobRequest.url,
        payload: jobRequest.body,
        headers: jobRequest.headers,
      }),
      existingSchedule.target_id,
      paused
    );

    if (!updatedRule.success) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: updatedRule.error }),
      };
    }

    // Update database entry
    const updatedSchedule = await db
      .update(tbl_schedules)
      .set({
        name,
        description,
        cron_expression: cron,
        request,
        paused,
        scheduled_for: getNextISO8601FromAWSCron(cron),
      })
      .where(eq(tbl_schedules.id, scheduleId))
      .returning()
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Schedule updated successfully",
        details: updatedSchedule[0],
      }),
    };
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to update schedule",
        error: error.message,
      }),
    };
  }
};
