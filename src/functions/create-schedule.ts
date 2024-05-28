import { APIGatewayProxyEvent } from "aws-lambda";

import { db } from "@/db";
import { tbl_schedules } from "@/db/schema/schema";

// ** import utils
import { getNextISO8601FromAWSCron } from "@/utils/time";
import { executeWebhook, sanitizeInput } from "@/utils/helper";

// ** import jobs
import { scheduleCronJob } from "@/jobs/schedule-job";

// ** import config
import { env } from "@/config";

// ** import middlewares & middy
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { customErrorHandler, secretKeyValidator } from "@/middlewares";

// ** import third party
import { v4 as uuidv4 } from "uuid";

interface SchedulePayload {
  project_id: number;
  name?: string;
  schedule_name?: string;
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

export const createSchedule = middy(async (event: APIGatewayProxyEvent) => {
  const projectId = parseInt(event.pathParameters!.project_id as string);

  let {
    name,
    schedule_name, // todo: add validation, pattern: [.-_A-Za-z0-9]+
    description,
    cron,
    request,
    paused,
    immediate_execute,
  } = JSON.parse(event.body!) as SchedulePayload;

  try {

    const scheduled_for = "--" //  getNextISO8601FromAWSCron(cron);

    const targetId = uuidv4(); // Generates a unique UUID

    schedule_name = sanitizeInput(`pid-${projectId}}_${new Date().getTime()}`); // todo

    const payload = JSON.stringify(
      {
        url: request.url,
        body: request.body,
        headers: request.headers,
      },
      null,
      2,
    );

    const { rule_arn } = await scheduleCronJob(
      schedule_name,
      `cron(${cron})`,
      env.WORKER_LAMBDA_ARN!,
      payload,
      targetId,
    );


    // Insert the new schedule into the database
    const newSchedule = await db
      .insert(tbl_schedules)
      .values({
        project_id: projectId,
        name,
        schedule_name,
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
})
  .use(httpEventNormalizer())
  .use(customErrorHandler)
  .before(secretKeyValidator);
