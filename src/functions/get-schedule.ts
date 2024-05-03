import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

// ** import db & schema
import { db, eq } from "@/db";
import { tbl_projects, tbl_schedules } from "@/db/schema/schema";

interface Project {
  id: number;
  secretKey: string;
}

export const listSchedules: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  const projectId = parseInt(event.queryStringParameters?.project_id || "");
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

    // Fetch schedules related to the project
    const schedules = await db.query.tbl_schedules.findMany({
      where: eq(tbl_schedules.project_id, projectId),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Schedules fetched successfully",
        data: {
          schedules,
        },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch schedules",
        error: error.message,
      }),
    };
  }
};
