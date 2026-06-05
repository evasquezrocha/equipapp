import fs from "node:fs";
import path from "node:path";
import sql from "mssql";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const config = {
  server: process.env.SQL_SERVER,
  port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 1433,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: process.env.SQL_ENCRYPT === "true",
    trustServerCertificate: process.env.SQL_TRUST_CERT === "true",
  },
};

async function columnExists(pool, tableName, columnName) {
  const result = await pool
    .request()
    .input("tableName", sql.NVarChar, tableName)
    .input("columnName", sql.NVarChar, columnName)
    .query(`
      SELECT 1 AS existsFlag
      FROM sys.columns c
      INNER JOIN sys.tables t ON t.object_id = c.object_id
      WHERE t.name = @tableName
        AND c.name = @columnName
    `);

  return Boolean(result.recordset[0]);
}

async function main() {
  const pool = await new sql.ConnectionPool(config).connect();

  try {
    const additions = [
      { name: "procesador", type: "NVARCHAR(120) NULL" },
      { name: "ram", type: "NVARCHAR(60) NULL" },
      { name: "almacenamiento", type: "NVARCHAR(120) NULL" },
    ];

    for (const column of additions) {
      const exists = await columnExists(pool, "equipos", column.name);
      if (!exists) {
        await pool.request().query(`
          ALTER TABLE dbo.equipos
          ADD ${column.name} ${column.type};
        `);
      }
    }

    console.log("Migracion de especificaciones de equipo aplicada correctamente.");
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
