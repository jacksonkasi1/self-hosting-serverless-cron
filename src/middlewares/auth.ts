import middy from "@middy/core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { db, eq } from "@/db";
import { tbl_projects } from "@/db/schema/schema";

// Custom error types
class BadRequestError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

class UnauthorizedError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

// Middleware to validate the secret key
export const secretKeyValidator = async (
  request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult, Error>,
) => {
  const projectId = parseInt(request.event.pathParameters?.project_id || "");
  const secretKey = request.event.headers["Secret-Key"];

  console.log({ projectId, secretKey });

  if (!projectId || !secretKey) {
    throw new BadRequestError("Missing project ID or secret key");
  }
  // First, validate the project's secret key
  const project = await db
    .select({
      id: tbl_projects.id,
      secretKey: tbl_projects.secretKey,
    })
    .from(tbl_projects)
    .where(eq(tbl_projects.id, projectId))
    .execute()
    .then((res) => res[0]);

  if (!project || project.secretKey !== secretKey) {
    throw new UnauthorizedError("Invalid project ID or secret key");
  }
};

// Custom error handler middleware object
export const customErrorHandler: middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = {
  onError: async (request) => {
    if (request.error) {
      const error = request.error;
      // Check if it is one of the custom errors or a generic error
      const statusCode =
        error instanceof BadRequestError || error instanceof UnauthorizedError
          ? error.statusCode
          : 500;
      const body = JSON.stringify({
        success: false,
        message: error.message,
      });

      request.response = {
        statusCode: statusCode,
        body: body,
      };
      return request.response; // This return is crucial for overriding the Lambda response
    }
  },
};
