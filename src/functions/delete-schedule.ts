import { APIGatewayProxyEvent } from "aws-lambda";

// ** import db & schema
import { and, db, eq } from "@/db";
import { tbl_schedules } from "@/db/schema/schema";

// ** import jobs
import { deleteCronJob } from "@/jobs/delete-job";

// ** import config
import { env } from "@/config";

// ** import middlewares & middy
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { customErrorHandler, secretKeyValidator } from "@/middlewares";

export const deleteSchedule = middy(async (event: APIGatewayProxyEvent) => {
  const scheduleId = parseInt(event.pathParameters!.schedule_id as string);
  const projectId = parseInt(event.pathParameters?.project_id || "");

  try {
    // Retrieve the schedule to get the associated rule ARN
    const schedule = await db
      .select({
        schedule_name: tbl_schedules.schedule_name,
        target_id: tbl_schedules.target_id,
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

    if (!schedule) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Schedule not found" }),
      };
    }

    // Delete the cron job from AWS EventBridge
    await deleteCronJob(schedule.schedule_name, schedule.target_id, env.WORKER_LAMBDA_ARN);

    // Delete the schedule from the database
    await db
      .delete(tbl_schedules)
      .where(eq(tbl_schedules.id, scheduleId))
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Schedule deleted successfully" }),
    };
  } catch (error: any) {
    console.error("Error deleting schedule:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to delete schedule",
        error: error.message,
      }),
    };
  }
})
  .use(httpEventNormalizer())
  .use(customErrorHandler)
  .before(secretKeyValidator);
