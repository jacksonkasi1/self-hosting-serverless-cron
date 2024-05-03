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
      })
      .returning()
      .execute();

    // If not paused && immediate execute, schedule the initial webhook trigger
    if (immediate_execute && !paused) {
      await executeWebhook(request);
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
  } catch (error) {
    console.error("Error creating schedule:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create schedule" }),
    };
  }
};
