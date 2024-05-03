import { Handler, APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

import { db, eq } from "@/db";
import { tbl_projects } from "@/db/schema/schema";

interface Project {
  name: string;
  secretKey: string;
  oldSecretKey?: string;
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
    const data: Project = JSON.parse(event.body!);
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

export const updateProject: Handler<
  APIGatewayEvent,
  APIGatewayProxyResult
> = async (event) => {
  try {
    const projectId = parseInt(event.pathParameters!.id as string);
    const data: Partial<Project> = JSON.parse(event.body!);

    const isProjectExists = await db.query.tbl_projects.findFirst({
      where: eq(tbl_projects.id, projectId),
    });

    if (!isProjectExists) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Project not found",
        }),
      };
    }

    if (data.secretKey && data.oldSecretKey != isProjectExists.secretKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Old secret key is incorrect",
        }),
      };
    }

    await db
      .update(tbl_projects)
      .set(data)
      .where(eq(tbl_projects.id, projectId))
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Project updated successfully",
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
};

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
