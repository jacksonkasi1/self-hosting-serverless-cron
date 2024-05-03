import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

// ** import db & schema
import { db, eq } from "@/db";
import { tbl_schedules } from "@/db/schema/schema";

// ** import jobs
import { deleteCronJob } from "@/jobs/delete-job";

export const deleteSchedule: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  const scheduleId = parseInt(event.pathParameters!.id as string);

  try {
    // Retrieve the schedule to get the associated rule ARN
    const schedule = await db
      .select({
        rule_arn: tbl_schedules.rule_arn,
        target_id: tbl_schedules.target_id,
      })
      .from(tbl_schedules)
      .where(eq(tbl_schedules.id, scheduleId))
      .execute()
      .then((res) => res[0]);

    if (!schedule) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Schedule not found" }),
      };
    }

    // Delete the cron job from AWS EventBridge
    await deleteCronJob(schedule.rule_arn, schedule.target_id);

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
};
