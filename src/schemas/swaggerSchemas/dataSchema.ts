import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { bulkRawDataInsertSchema, searchQuerySchema } from "../dataSchema";
import { StatusCodes } from "http-status-codes";
import z from "zod";

export const bulkRawDataInsertRouteConfig: RouteConfig = {
    method: 'post',
    path: '/internal/mentions/bulk',
    summary: 'Bulk insert mention data',
    tags: ['Mention'],
    request: {
        body: {
            content: {
                'application/json': { schema: bulkRawDataInsertSchema },
            },
        },
    },
    responses: {
        [StatusCodes.OK]: {
            description: 'Data processed',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string().openapi({ example: "Data processed" }),
                        data: z.object({
                            processed: z.number().openapi({ example: 10 }),
                            inserted: z.number().openapi({ example: 9 }),
                        }),
                    }),
                },
            },
        },
        [StatusCodes.INTERNAL_SERVER_ERROR]: {
            description: 'Internal server error',
        },
    },
};

export const searchQueryRouteConfig: RouteConfig = {
    method: 'get',
    path: '/mentions',
    summary: 'Search data by keyword, source, date range and can be sort order',
    tags: ['Mention'],
    request: {
        query: searchQuerySchema
    },
    responses: {
        [StatusCodes.OK]: {
            description: 'Data processed',
            content: {
                'application/json': {
                    schema: z.object({
                        data: bulkRawDataInsertSchema,
                        pagination: z.object({
                            page: z.number().openapi({ example: 1 }),
                            limit: z.number().openapi({ example: 10 }),
                            total: z.number().openapi({ example: 100 }),
                            totalPage: z.number().openapi({ example: 2 })
                        })
                    })
                },
            },
        },
        [StatusCodes.INTERNAL_SERVER_ERROR]: {
            description: 'Internal server error',
        },
    },
};