import { Handler, APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

import { db, eq } from "@/db";
import { tbl_projects } from "@/db/schema/schema";

interface Project {
  id: number;
  name: string;
  secretKey: string;
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
    const newProject = await db.insert(tbl_projects).values(data).execute();
    return { statusCode: 201, body: JSON.stringify(newProject) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export const updateProject: Handler<
  APIGatewayEvent,
  APIGatewayProxyResult
> = async (event) => {
  try {
    const projectId = parseInt(event.pathParameters!.id as string);
    const data: Partial<Project> = JSON.parse(event.body!);
    const updatedProject = await db
      .update(tbl_projects)
      .set(data)
      .where(eq(tbl_projects.id, projectId))
      .execute();
    return { statusCode: 200, body: JSON.stringify(updatedProject) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
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
    return { statusCode: 200, body: JSON.stringify(projects) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
