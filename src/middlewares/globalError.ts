import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import debug from '../libs/debuger';
import processEnv from '../../env';
import { DatabaseError } from 'pg';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    if (processEnv.ENV === "development") {
        debug("error", `[ERROR] ${req.method} ${req.path}:`, err)
    } else {
        console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    }

    // Zod Error
    if (err instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Validation failed',
            errors: err.flatten().fieldErrors,
        });
    }

    /// Database Error
    if (err instanceof DatabaseError) {
        if (err.code === '23505') {
            const field = err.detail?.match(/\((.*?)\)/)?.[1] || 'field';
            return res.status(StatusCodes.CONFLICT).json({
                message: `A record with this ${field} already exists.`,
            });
        }

        if (err.code === '23503') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Referenced record does not exist or is in use.',
            });
        }

        if (err.code === '23502') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: `Field '${err.column}' cannot be null.`,
            });
        }

        if (err.code === '22P02') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Invalid input data format.',
            });
        }
    }

    // Custom Error
    if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
        return res.status((err as any).statusCode).json({
            message: err.message,
        });
    }

    // Fall back Internal Server Error
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};