import { Request } from "express";
import z from "zod";

function parseWithSchema<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown
): z.infer<T> {
    return schema.parse(data);
}

const getRequestData = <
    B extends z.ZodTypeAny | undefined,
    P extends z.ZodTypeAny | undefined,
    Q extends z.ZodTypeAny | undefined
>(
    schemas: {
        bodySchema?: B;
        paramsSchema?: P;
        querySchema?: Q;
    },
    req: Request
) => {
    const bodyData = schemas.bodySchema
        ? parseWithSchema(schemas.bodySchema, req.body)
        : undefined;

    const paramsData = schemas.paramsSchema
        ? parseWithSchema(schemas.paramsSchema, req.params)
        : undefined;

    const queryData = schemas.querySchema
        ? parseWithSchema(schemas.querySchema, req.query)
        : undefined;

    return {
        bodyData: bodyData as B extends z.ZodTypeAny ? z.infer<B> : undefined,
        paramsData: paramsData as P extends z.ZodTypeAny ? z.infer<P> : undefined,
        queryData: queryData as Q extends z.ZodTypeAny ? z.infer<Q> : undefined,
    };
};

export default getRequestData