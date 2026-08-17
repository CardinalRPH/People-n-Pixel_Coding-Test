import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { StatusCodes } from "http-status-codes";
import z from "zod";

export const exampleRouteConfig: RouteConfig = {
    method: 'get',
    path: '/example',
    tags: ['Example'],
    request: {
        params: z.object({
            id: z.string().openapi({ example: 'exampleID' })
        })
    },
    responses: {
        [StatusCodes.OK]: {
            description: 'Example Get',
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string().openapi({ example: 'Example Message' })
                    })
                }
            }
        }
    }
}