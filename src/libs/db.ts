import { Pool } from 'pg';
import processEnv from '../../env';
const pool = new Pool({
    user: processEnv.DATABASE_USER,
    host: processEnv.DATABASE_HOST,
    database: processEnv.DATABASE_NAME,
    password: processEnv.DATABASE_PASSWORD,
    port: processEnv.DATABASE_PORT
})

export type queryParamsType = string | number | Date | boolean | null;

export default pool
