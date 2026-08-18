import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { bulkRawDataInsertSchema, searchQuerySchema, statsQuerySchema } from "../dataSchema";
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
            description: 'Data successfully insert',
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
            description: 'Data successfully get',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string().openapi({ example: "Data Fetched" }),
                        data: bulkRawDataInsertSchema,
                        pagination: z.object({
                            page: z.number().openapi({ example: 1 }),
                            limit: z.number().openapi({ example: 10 }),
                            total: z.number().openapi({ example: 100 }),
                            totalPage: z.number().openapi({ example: 2 }),
                            hasNext: z.boolean().openapi({ example: true }),
                            nextPage: z.number().nullable().openapi({ example: 2 }),
                            prevPage: z.number().nullable().openapi({ example: null }),
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


export const statshQueryRouteConfig: RouteConfig = {
    method: 'get',
    path: '/mentions/stats',
    summary: 'Get stats of the data',
    tags: ['Mention'],
    request: {
        query: statsQuerySchema
    },
    responses: {
        [StatusCodes.OK]: {
            description: 'Data successfully get',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string().openapi({ example: "Data Fetched" }),
                        group_by: z.enum(['source', 'day']).openapi({ example: 'day' }),
                        data: z.array(z.object({
                            label: z.string().openapi({ example: "2026-08-15" }),
                            count: z.number().openapi({ example: 1 })
                        }))
                    })
                },
            },
        },
        [StatusCodes.INTERNAL_SERVER_ERROR]: {
            description: 'Internal server error',
        },
    },
};