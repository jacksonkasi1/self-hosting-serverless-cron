import { APIGatewayProxyEvent } from "aws-lambda";

// ** import db & schema
import { db, eq } from "@/db";
import { tbl_schedules } from "@/db/schema/schema";

// ** import middlewares & middy
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { customErrorHandler, secretKeyValidator } from "@/middlewares";

export const listSchedules = middy(async (event: APIGatewayProxyEvent) => {
  const projectId = parseInt(event.pathParameters?.project_id || "");

  try {
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
})
  .use(httpEventNormalizer())
  .use(customErrorHandler)
  .before(secretKeyValidator);
