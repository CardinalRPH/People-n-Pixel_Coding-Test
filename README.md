# Coding Test for People and Pixel

## About
**Name:** Rayhan Febriyan Saputra

**Project:** Coding Test for People and Pixel to Apply Junior Full-Stack Developer

## Deduplication Logic

### How "Duplicate" is Defined
To ensure data integrity and prevent redundant entries, I use a combination of normalized content and URL links as unique identifiers. Specifically:
- **Identifier:** A SHA-256 hash is generated from the normalized `content` and `url`.
- **Storage:** This hash is stored in the `dedup_hash` column in the database.
- **Constraints:** Unique constraints are applied to both `source_normalized` and `dedup_hash` columns.
- **Source Normalization:** The `source_normalized` column contains values that have been cleaned and standardized to account for variations in source names.

### Handling Item Duplication

#### Case 1: Existing Database Record vs. New Input
If a newly input value is identified as a duplicate of an existing record in the database:
- The system identifies potential unique values based on the seed data (e.g., `seed_mentions.json`).
- Instead of creating a new entry, the **engagement** value is updated. The system retains the higher value between the existing database record and the new input.

#### Case 2: Duplicate "external_id" or content in Bulk Input
When multiple duplicate items are present within the same input payload:
- After Zod validation, the data undergoes a normalization process (generating `source_normalized` and `dedup_hash`).
- The data is processed using a `Map` where `Map.set()` utilizes the combination of `source_normalized` and `dedup_hash` as the unique key.
- If duplicates are found within the input, the item with the **highest engagement** value is selected and preserved.

---

## Installation

### Prerequisites
- **Node.js:** Version 22+
- **Yarn:** Package manager

### Steps
1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   yarn install
   ```
3. **Environment Setup:**
   There are three types of environment examples provided:
   - `.example.env.development`: For development mode (`yarn dev`)
   - `.example.env.testing`: For testing mode (`yarn test`)
   - `.example.env.production`: For production level

   Rename the desired files to remove the `.example` prefix (e.g., `.env.development`, `.env.production`, `.env.testing`).

4. **Database Configuration:**
   In your `.env` files, please complete the following variables:
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`
   - `DATABASE_NAME`
   - `DATABASE_HOST`
   - `DATABASE_PORT`
   - `DATABASE_URL` (Format: `postgresql://user:password@host:port/dbname`)

5. **Run Migrations:**
   Run the appropriate command for your environment:
   ```bash
   # For test database
   yarn db:migrate:test

   # For development database
   yarn db:migrate:dev

   # For production database
   yarn db:migrate:prod
   ```

---

## API Documentation & Usage

### Deployed URL
[https://venational-edmond-untameable.ngrok-free.dev](https://venational-edmond-untameable.ngrok-free.dev)

> **Note:** The Deployed URL is served via **ngrok** because the application is hosted on a home server.

### Available Interfaces
- **GUI (Frontend):** `/fe` (GET) - A simple frontend to interact with the program.
- **API Documentation:** `/docs/v1` (GET) - Interactive API documentation (Swagger/OpenAPI).

### API Endpoints
- **Bulk Insert Mentions:** `POST /internal/mentions/bulk` - For bulk insertion of mention data.
- **Search Mentions:** `GET /mentions` - Search data by keyword, source, or date range.
- **Statistics:** `GET /mentions/stats` - Get data statistics grouped by "day" or "source".

---

## Useful Commands
- **Run Tests:** `yarn test` - Executes the test cases.
- **Linting:** `yarn lint` - Checks for code formatting and quality.
- **Build:** `yarn build` - build the entire code to production level.
