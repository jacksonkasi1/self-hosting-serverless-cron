import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import { db } from "@/db";
import { tbl_schedules } from "@/db/schema/schema";

// ** import functions
import { executeWebhook } from "./execute-webhook";

// ** import utils
import { getNextExecutionTime } from "@/utils/time";
import { scheduleCronJob } from "@/utils/cron";

// ** import config
import { env } from "@/config";

// ** import third party
import { v4 as uuidv4 } from "uuid";

interface SchedulePayload {
  project_id: number;
  name: string;
  description: string;
  cron: string;
  request: {
    body: string;
    headers: Record<string, string>;
    url: string;
  };
  paused: boolean;
  immediate_execute: boolean;
}

export const createSchedule: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  try {
    const {
      project_id,
      name,
      description,
      cron,
      request,
      paused,
      immediate_execute,
    } = JSON.parse(event.body!) as SchedulePayload;

    const targetId = uuidv4(); // Generates a unique UUID

    const { rule_arn } = await scheduleCronJob(
      name,
      cron,
      env.WORKER_LAMBDA_ARN!,
      JSON.stringify({
        url: request.url,
        payload: request.body,
        headers: request.headers,
      }),
      targetId,
    );

    const scheduled_for = getNextExecutionTime(cron);

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
        scheduled_for,
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
