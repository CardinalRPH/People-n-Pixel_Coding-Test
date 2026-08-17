import z from "zod";
import dotenv from 'dotenv'
import path from "path";

const environment = process.env.NODE_ENV || "production"
const envFile = `.env.${environment}`

dotenv.config({
    path: path.resolve(process.cwd(), envFile)
})

const envSchema = z.object({
    ENV: z
        .union([
            z.literal('development'),
            z.literal('testing'),
            z.literal('production'),
        ])
        .default('development'),

    PORT: z.coerce.number(),

    APP_NAME: z.string(),

    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    DATABASE_NAME: z.string(),
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.coerce.number(),

})

const processEnv = envSchema.parse(process.env)

export default processEnv