import app from "./app";
import pool from "./lib/db";
import { logger } from "./lib/logger";

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      diamonds INT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      label TEXT,
      is_popular BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT,
      package_id INT,
      diamonds INT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      mlbb_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='orders' AND column_name='clerk_user_id'
      ) THEN
        ALTER TABLE orders ADD COLUMN clerk_user_id TEXT;
      END IF;
    END$$;
  `);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

initDb()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to initialize DB");
    process.exit(1);
  });
