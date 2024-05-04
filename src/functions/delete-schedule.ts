import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

// ** import db & schema
import { db, eq } from "@/db";
import { tbl_projects, tbl_schedules } from "@/db/schema/schema";

// ** import jobs
import { deleteCronJob } from "@/jobs/delete-job";

interface Project {
  id: number;
  secretKey: string;
}

export const deleteSchedule: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  const scheduleId = parseInt(event.pathParameters!.schedule_id as string);
  const projectId = parseInt(event.pathParameters!.project_id as string);
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

    // Retrieve the schedule to get the associated rule ARN
    const schedule = await db
      .select({
        schedule_name: tbl_schedules.schedule_name,
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
    await deleteCronJob(schedule.schedule_name, schedule.target_id);

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
