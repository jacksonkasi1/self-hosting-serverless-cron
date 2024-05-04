import {
  Handler,
  APIGatewayEvent,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from "aws-lambda";

import { db, eq } from "@/db";
import { tbl_projects } from "@/db/schema/schema";

// ** import middlewares & middy
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { customErrorHandler, secretKeyValidator } from "@/middlewares";

interface NewProject {
  name: string;
  secretKey: string;
}

interface UpdateProject {
  name: string;
  secretKey?: string;
}

interface ProjectList {
  id: number;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const createProject: Handler<
  APIGatewayEvent,
  APIGatewayProxyResult
> = async (event) => {
  try {
    const data: NewProject = JSON.parse(event.body!);
    const newProject = await db
      .insert(tbl_projects)
      .values(data)
      .returning()
      .execute();
    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Schedule created successfully",
        data: {
          details: newProject[0],
        },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to create project",
        error: error.message,
      }),
    };
  }
};

export const updateProject = middy(async (event: APIGatewayProxyEvent) => {
  try {
    const projectId = parseInt(event.pathParameters!.project_id as string);
    const data: Partial<UpdateProject> = JSON.parse(event.body!);

    const updatedProject = await db
      .update(tbl_projects)
      .set(data)
      .where(eq(tbl_projects.id, projectId))
      .returning()
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Project updated successfully",
        data: {
          details: updatedProject[0],
        }
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to update project",
        error: error.message,
      }),
    };
  }
})
  .use(httpEventNormalizer())
  .use(customErrorHandler)
  .before(secretKeyValidator);

export const listProjects: Handler<
  APIGatewayEvent,
  APIGatewayProxyResult
> = async () => {
  try {
    const projects: ProjectList[] = await db
      .select({
        id: tbl_projects.id,
        name: tbl_projects.name,
        createdAt: tbl_projects.createdAt,
        updatedAt: tbl_projects.updatedAt,
      })
      .from(tbl_projects)
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Projects fetched successfully",
        data: {
          projects,
        },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch projects",
        error: error.message,
      }),
    };
  }
};
