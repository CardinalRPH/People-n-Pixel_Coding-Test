import request from 'supertest';
import express, { Express } from 'express';
import { StatusCodes } from 'http-status-codes';

import router from '../src/routes';
import pool from '../src/libs/db';
import dummyData from '../src/data/dummy';

// Setup Express app instance for Supertest
const app: Express = express();
app.use(express.json());
app.use('/', router);

// Global Error Handler for Express during testing
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: err.message || 'Internal Server Error',
    });
});

describe('Mentions API Endpoints', () => {
    // Clean up database before and after running tests
    beforeEach(async () => {
        await pool.query('DELETE FROM mentions;');
    });

    afterAll(async () => {
        await pool.query('DELETE FROM mentions;');
        await pool.end(); // Close DB pool connection after tests complete
    });

    /* ========================================================================
       POST /internal/mentions/bulk
       ======================================================================== */
    describe('POST /internal/mentions/bulk', () => {

        it('should successfully bulk insert the full dummy dataset with transforms and handle conflicts', async () => {
            const response = await request(app)
                .post('/internal/mentions/bulk')
                .send(dummyData);

            expect(response.status).toBe(StatusCodes.CREATED);
            expect(response.body).toEqual({
                message: 'Data processed',
                data: {
                    processed: 15,
                    inserted: 14,
                    modified: 0,
                },
            });

            // Check HTML stripping transform on content field
            const dbResHtml = await pool.query('SELECT content FROM mentions WHERE external_id = $1', ['nst-40130']);
            expect(dbResHtml.rows[0].content).toBe('Several roads in Shah Alam were impassable after two hours of heavy rain.alert(1)');

            // Check string-to-integer engagement conversion
            const dbResEngagement = await pool.query('SELECT engagement FROM mentions WHERE external_id = $1', ['nst-40021']);
            expect(dbResEngagement.rows[0].engagement).toBe(1204);

            // Check UPSERT updated engagement value to maximum (415)
            const dbResUpsert = await pool.query('SELECT engagement FROM mentions WHERE external_id = $1', ['str-99120']);
            expect(dbResUpsert.rows[0].engagement).toBe(415);
        });

        it('should return 200 OK with message when body array is empty', async () => {
            const response = await request(app)
                .post('/internal/mentions/bulk')
                .send([]);

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toEqual({
                message: 'No data to be process',
            });
        });

        it('should fail validation when payload structure is invalid', async () => {
            const invalidMention = {
                external_id: '', // Min length 1 validation error
                source: 'The Star',
                url: 'invalid-url-string',
            };

            const response = await request(app)
                .post('/internal/mentions/bulk')
                .send([invalidMention]);

            expect(response.status).toBeGreaterThanOrEqual(StatusCodes.BAD_REQUEST);
        });
    });
    /* ========================================================================
       GET /mentions
       ======================================================================== */
    describe('GET /mentions', () => {
        beforeEach(async () => {
            // Seed dummy records for search/pagination testing
            await pool.query(`
        INSERT INTO mentions 
          (external_id, source, source_normalized, title, content, url, author, published_at, engagement, dedup_hash)
        VALUES 
          ('id-1', 'The Star', 'the star', 'Ringgit Gains', 'Ringgit economy is booming', 'https://example.com/1', 'Author A', '2026-08-10T10:00:00Z', 100, 'hash1'),
          ('id-2', 'TechCrunch', 'techcrunch', 'AI Revolution', 'New breakthroughs in tech', 'https://example.com/2', 'Author B', '2026-08-12T10:00:00Z', 250, 'hash2'),
          ('id-3', 'The Star', 'the star', 'Market Update', 'Stock market sees steady ringgit growth', 'https://example.com/3', 'Author C', '2026-08-15T10:00:00Z', 300, 'hash3');
      `);
        });

        it('should return paginated mentions with default pagination options', async () => {
            const response = await request(app).get('/mentions');

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.data.length).toBe(3);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 3,
                totalPages: 1,
            });
        });

        it('should filter mentions by search query (q)', async () => {
            const response = await request(app)
                .get('/mentions')
                .query({ q: 'Ringgit' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.data.length).toBe(2);
            expect(response.body.pagination.total).toBe(2);
        });

        it('should filter mentions by normalized source', async () => {
            const response = await request(app)
                .get('/mentions')
                .query({ source: 'The Star' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0].source).toBe('The Star');
        });

        it('should filter mentions by date range (from / to)', async () => {
            const response = await request(app)
                .get('/mentions')
                .query({
                    from: '2026-08-11T00:00:00Z',
                    to: '2026-08-16T00:00:00Z',
                });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.data.length).toBe(2); // id-2 and id-3
        });

        it('should respect pagination limit and page options', async () => {
            const response = await request(app)
                .get('/mentions')
                .query({ page: 1, limit: 2 });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.data.length).toBe(2);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 2,
                total: 3,
                totalPages: 2,
            });
        });
    });

    /* ========================================================================
     GET /mentions/stats
     ======================================================================== */
    describe('GET /mentions/stats', () => {
        beforeEach(async () => {
            // Seed dummy records for stats testing
            await pool.query(`
      INSERT INTO mentions 
        (external_id, source, source_normalized, title, content, url, author, published_at, engagement, dedup_hash)
      VALUES 
        ('id-1', 'The Star', 'the star', 'Title 1', 'Content 1', 'https://example.com/1', 'Author A', '2026-08-10T10:00:00Z', 100, 'hash1'),
        ('id-2', 'The Star', 'the star', 'Title 2', 'Content 2', 'https://example.com/2', 'Author B', '2026-08-10T14:00:00Z', 150, 'hash2'),
        ('id-3', 'TechCrunch', 'techcrunch', 'Title 3', 'Content 3', 'https://example.com/3', 'Author C', '2026-08-11T09:00:00Z', 200, 'hash3'),
        ('id-4', 'Null Date', 'null date', 'Title 4', 'Content 4', 'https://example.com/4', 'Author D', NULL, 0, 'hash4');
    `);
        });

        it('should return aggregated stats grouped by source', async () => {
            const response = await request(app)
                .get('/mentions/stats')
                .query({ group_by: 'source' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toEqual({
                message: 'Data Fetched',
                group_by: 'source',
                data: expect.arrayContaining([
                    { label: 'the star', count: 2 },
                    { label: 'techcrunch', count: 1 },
                    { label: 'null date', count: 1 },
                ]),
            });
            // Check ordering by count DESC
            expect(response.body.data[0]).toEqual({ label: 'the star', count: 2 });
        });

        it('should return aggregated stats grouped by day (excluding NULL published_at)', async () => {
            const response = await request(app)
                .get('/mentions/stats')
                .query({ group_by: 'day' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toEqual({
                message: 'Data Fetched',
                group_by: 'day',
                data: [
                    { label: '2026-08-11', count: 1 },
                    { label: '2026-08-10', count: 2 },
                ],
            });
        });

        it('should return a validation error if group_by parameter is missing', async () => {
            const response = await request(app).get('/mentions/stats');

            expect(response.status).toBeGreaterThanOrEqual(StatusCodes.BAD_REQUEST);
        });

        it('should return a validation error if group_by is invalid', async () => {
            const response = await request(app)
                .get('/mentions/stats')
                .query({ group_by: 'invalid_type' });

            expect(response.status).toBeGreaterThanOrEqual(StatusCodes.BAD_REQUEST);
        });
    });
});