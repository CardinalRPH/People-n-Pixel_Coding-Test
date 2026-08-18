import { NextFunction, Request, Response } from "express";
import getRequestData from "../utils/getRequestData";
import { bulkRawDataInsertSchema, searchQuerySchema, statsQuerySchema } from "../schemas/dataSchema";
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
        const rawNormalizedItem = bodyData.map(normalizeMention);

        const dedupMap = new Map<string, normalizeItemData>();

        for (const item of rawNormalizedItem) {
            const key = `${item.source_normalized}:${item.dedup_hash}`;

            if (dedupMap.has(key)) {
                const existing = dedupMap.get(key)!;
                existing.engagement = Math.max(existing.engagement, item.engagement);
            } else {
                dedupMap.set(key, { ...item });
            }
        }

        const normalizedItem = Array.from(dedupMap.values());

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
        const totalPages = Math.ceil(total / limit);

        const hasNext = page < totalPages;

        return res.status(StatusCodes.OK).json({
            message: "Data Fetched",
            data: dataRes.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext,
                nextPage: hasNext ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
        });

    } catch (error) {
        next(error)
    }
}

export const statsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { queryData } = getRequestData({ querySchema: statsQuerySchema }, req)
        const { group_by } = queryData

        if (group_by === "source") {
            const sql = `
        SELECT source_normalized AS label, COUNT(*)::int AS count
        FROM mentions
        GROUP BY source_normalized
        ORDER BY count DESC;
      `;
            const { rows } = await pool.query(sql);
            return res.status(StatusCodes.OK).json({
                message: "Data Fetched",
                group_by: 'source',
                data: rows
            });
        }

        if (group_by === 'day') {
            const sql = `
        SELECT TO_CHAR(published_at, 'YYYY-MM-DD') AS label, COUNT(*)::int AS count
        FROM mentions
        WHERE published_at IS NOT NULL
        GROUP BY TO_CHAR(published_at, 'YYYY-MM-DD')
        ORDER BY label DESC;
      `;
            const { rows } = await pool.query(sql);
            return res.status(StatusCodes.OK).json({
                message: "Data Fetched",
                group_by: 'day',
                data: rows
            });
        }
    } catch (error) {
        next(error)
    }
} 