import "server-only";

import sql from "mssql";

const dbConfig: sql.config = {
  server: process.env.SQL_SERVER ?? "",
  port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 1433,
  database: process.env.SQL_DATABASE ?? "",
  user: process.env.SQL_USER ?? "",
  password: process.env.SQL_PASSWORD ?? "",
  options: {
    encrypt: process.env.SQL_ENCRYPT === "true",
    trustServerCertificate: process.env.SQL_TRUST_CERT === "true",
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function ensureConfig() {
  const required = ["SQL_SERVER", "SQL_DATABASE", "SQL_USER", "SQL_PASSWORD"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno de SQL: ${missing.join(", ")}`);
  }
}

export async function getPool() {
  ensureConfig();

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

export async function runQuery<T = unknown>(builder: (request: sql.Request) => Promise<sql.IResult<T>> | sql.IResult<T>) {
  const pool = await getPool();
  const request = pool.request();
  return builder(request);
}

