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

async function main() {
  const pool = await new sql.ConnectionPool(config).connect();

  try {
    await pool.request().query(`
      IF EXISTS (
        SELECT 1
        FROM sys.key_constraints kc
        INNER JOIN sys.tables t ON t.object_id = kc.parent_object_id
        WHERE kc.name = 'UQ_equipos_empresa_serial'
          AND t.name = 'equipos'
      )
      BEGIN
        ALTER TABLE dbo.equipos DROP CONSTRAINT UQ_equipos_empresa_serial;
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.tables t ON t.object_id = i.object_id
        WHERE i.name = 'UQ_equipos_empresa_serial'
          AND t.name = 'equipos'
      )
      BEGIN
        CREATE UNIQUE INDEX UQ_equipos_empresa_serial
          ON dbo.equipos (empresa_id, serial)
          WHERE serial IS NOT NULL;
      END
    `);

    console.log("Indice unico filtrado de serial aplicado correctamente.");
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
