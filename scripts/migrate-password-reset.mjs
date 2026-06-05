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
  await pool.request().batch(`
    IF COL_LENGTH('dbo.usuarios', 'password_updated_at') IS NULL
    BEGIN
      ALTER TABLE dbo.usuarios
      ADD password_updated_at DATETIME2 NOT NULL
        CONSTRAINT DF_usuarios_password_updated_at DEFAULT(SYSDATETIME()) WITH VALUES;
    END
  `);

  await pool.request().batch(`
    IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.password_reset_tokens (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        usuario_id INT NOT NULL,
        token_hash NVARCHAR(255) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_password_reset_tokens_created_at DEFAULT(SYSDATETIME()),
        CONSTRAINT UQ_password_reset_tokens_token_hash UNIQUE (token_hash),
        CONSTRAINT FK_password_reset_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id) ON DELETE CASCADE
      );
    END
  `);

  await pool.request().batch(`
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_password_reset_tokens_usuario' AND object_id = OBJECT_ID('dbo.password_reset_tokens'))
      CREATE INDEX IX_password_reset_tokens_usuario ON dbo.password_reset_tokens(usuario_id);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_password_reset_tokens_expires_at' AND object_id = OBJECT_ID('dbo.password_reset_tokens'))
      CREATE INDEX IX_password_reset_tokens_expires_at ON dbo.password_reset_tokens(expires_at);
  `);

  await pool.close();
  console.log("Migracion de recuperacion de contrasena aplicada correctamente.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
