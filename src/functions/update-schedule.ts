import { APIGatewayProxyEvent } from "aws-lambda";

import { and, db, eq } from "@/db";
import { tbl_schedules } from "@/db/schema/schema";

// ** import utils
import { getNextISO8601FromAWSCron } from "@/utils/time";

// ** import jobs
import { scheduleCronJob } from "@/jobs/schedule-job";

// ** import config
import { env } from "@/config";

// ** import middlewares & middy
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { customErrorHandler, secretKeyValidator } from "@/middlewares";

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
export const updateSchedule = middy(async (event: APIGatewayProxyEvent) => {
  const scheduleId = parseInt(event.pathParameters!.schedule_id as string);
  const projectId = parseInt(event.pathParameters?.project_id || "");

  let {
    name,
    description,
    cron,
    request,
    paused = false,
  } = JSON.parse(event.body!) as ScheduleUpdatePayload;

  try {
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
      .where(
        and(
          eq(tbl_schedules.id, scheduleId),
          eq(tbl_schedules.project_id, projectId),
        ),
      )
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

    const payload = JSON.stringify(
      {
        url: jobRequest.url,
        body: jobRequest.body,
        headers: jobRequest.headers,
      },
      null,
      2,
    );

    // Update AWS EventBridge Rule
    const updatedRule = await scheduleCronJob(
      existingSchedule.schedule_name, // no need to change the name
      `cron(${cron})`,
      env.WORKER_LAMBDA_ARN!,
      payload,
      existingSchedule.target_id,
      paused,
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
})
  .use(httpEventNormalizer())
  .use(customErrorHandler)
  .before(secretKeyValidator);
