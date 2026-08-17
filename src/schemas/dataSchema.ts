import z from "zod";

export const mentionRawDataSchema = z.object({
    external_id: z.string()
        .min(1, "external_id is required")
        .openapi({ example: "str-99120" }),
    source: z.string()
        .min(1, "source is required")
        .openapi({ example: "The Star" }),
    title: z.string("Title is required or nullable")
        .nullable()
        .openapi({ example: "Ringgit strengthens against US dollar in early trade" }),
    content: z.string("Content is required")
        .transform((val) => val.replace(/<[^>]*>?/gm, '').trim())
        .openapi({ example: "The ringgit opened higher against the greenback on Monday, buoyed by&nbsp;improved sentiment" }),
    url: z.url("URL is required")
        .openapi({ example: "https://www.thestar.com.my/business/2026/08/10/ringgit-strengthens" }),
    author: z.string("Author is required or nullable")
        .nullable()
        .openapi({ example: null }),
    engagement: z.preprocess((val) => {
        if (typeof val === 'number') {
            return val
        }
        if (typeof val === 'string') {
            return parseInt(val.replace(/,/g, ''), 10)
        }
        return val
    }, z.number("engagement is string that can be parsed into number or number"))
        .openapi({ example: 415 }),
    published_at: z.preprocess((val) => {
        if (typeof val === "number") {
            const ms = val < 1e11 ? val * 1000 : val
            return new Date(ms)
        }

        if (typeof val === 'string') {
            if (!isNaN(Number(val)) && val.trim() !== '') {
                const num = Number(val);
                const ms = num < 1e11 ? num * 1000 : num;
                return new Date(ms);
            }
            return new Date(val);
        }
        return val;
    }, z.date("published_at is string that can be parsed into number or number or nullable"))
        .nullable()
        .openapi({ example: "2026-08-15T13:30:00+08:00" })

})

export type mentionRawDataSchemaType = z.infer<typeof mentionRawDataSchema>

export const bulkRawDataInsertSchema = z.array(mentionRawDataSchema)

export const SearchQuerySchema = z.object({
    q: z.string("Query must be string")
        .optional()
        .openapi({ example: "Ringgit strengthens against US dollar in early trade" }),
    source: z.string("Source must be string")
        .optional()
        .openapi({ example: "The Star" }),
    from: z.iso
        .datetime({ offset: true })
        .or(z.string("From must be iso string"))
        .optional()
        .openapi({ example: "2026-08-10 08:20:00" }),
    to: z.iso
        .datetime({ offset: true })
        .or(z.string("To must be iso string"))
        .optional()
        .openapi({ example: "2026-08-10 08:20:00" }),
    page: z.coerce
        .number("Must be string that can be parsed into number")
        .int()
        .min(1)
        .default(1)
        .openapi({ example: "1" }),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .openapi({ example: "10" }),
});

export const StatsQuerySchema = z.object({
    group_by: z.enum(['source', 'day'], {
        error: "group_by must be either 'source' or 'day"
    }).openapi({ example: "day" }),
});