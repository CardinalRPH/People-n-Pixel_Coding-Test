import { NextFunction, Request, Response } from "express";
import getRequestData from "../utils/getRequestData";
import { bulkRawDataInsertSchema, searchQuerySchema } from "../schemas/dataSchema";
import { normalizeItemData, normalizeMention } from "../utils/normalizer";
import { StatusCodes } from "http-status-codes";
import pool, { queryParamsType } from "../libs/db";

export const bulkInsertHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bodyData } = getRequestData({ bodySchema: bulkRawDataInsertSchema }, req)
        if (bodyData.length <= 0) {
            return res.status(StatusCodes.OK).json({
                message: "No data to be process"

            })
        }
        const normalizedItem = bodyData.map(normalizeMention)

        const rowToProcess = 10
        const valuePerTuple: string[] = []
        const queryParams: queryParamsType[] = []

        normalizedItem.forEach((item, index) => {
            const offset = index * rowToProcess
            valuePerTuple.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`
            );
            queryParams.push(
                item.external_id,
                item.source,
                item.source_normalized,
                item.title,
                item.content,
                item.url,
                item.author,
                item.published_at,
                item.engagement,
                item.dedup_hash
            )

        })

        console.log(queryParams);


        const bulkQuery = `
      INSERT INTO mentions (
        external_id, source, source_normalized, title, content,
        url, author, published_at, engagement, dedup_hash
      ) 
      VALUES ${valuePerTuple.join(', ')}
      ON CONFLICT (source_normalized, dedup_hash) DO UPDATE SET
        engagement = GREATEST(mentions.engagement, EXCLUDED.engagement),
        updated_at = NOW()
      RETURNING (xmax = 0) AS is_insert;
    `;

        const result = await pool.query(bulkQuery, queryParams)

        const insertedCount = result.rows.filter((row) => row.is_insert).length;
        const modifiedCount = result.rows.filter((row) => !row.is_insert).length;

        return res.status(StatusCodes.CREATED).json({
            message: "Data processed",
            data: {
                processed: bodyData.length,
                inserted: insertedCount,
                modified: modifiedCount
            }
        })
    } catch (error) {
        next(error)
    }
}

export const searchHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { queryData } = getRequestData({ querySchema: searchQuerySchema }, req)

        const { limit, page, from, q, source, to } = queryData
        const offset = (page - 1) * limit

        const conditions: string[] = []
        const values: queryParamsType[] = []

        if (q) {
            values.push(`%${q}%`);
            conditions.push(`(title ILIKE $${values.length} OR content ILIKE $${values.length})`);
        }

        if (source) {
            values.push(source.trim().toLowerCase());
            conditions.push(`source_normalized = $${values.length}`);
        }

        if (from) {
            values.push(new Date(from));
            conditions.push(`published_at >= $${values.length}`);
        }

        if (to) {
            values.push(new Date(to));
            conditions.push(`published_at <= $${values.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
      SELECT id, external_id, source, title, content, url, author, published_at, engagement
      FROM mentions
      ${whereClause}
      ORDER BY published_at DESC NULLS LAST, id DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `
        const countSql = `SELECT COUNT(*) FROM mentions ${whereClause}`;

        const [dataRes, countRes] = await Promise.all([
            pool.query(sql, [...values, limit, offset]),
            pool.query(countSql, values),
        ]);

        const total = parseInt(countRes.rows[0].count, 10);

        return res.status(StatusCodes.OK).json({
            data: dataRes.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        next(error)
    }
}

export const statsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {

    } catch (error) {
        next(error)
    }
} 