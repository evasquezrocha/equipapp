import sql from "mssql";
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador";

  if (!email || !password) {
    throw new Error("Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD antes de ejecutar el script.");
  }

  const pool = await new sql.ConnectionPool(config).connect();
  const request = pool.request();
  request.input("email", sql.NVarChar, email.toLowerCase());
  request.input("name", sql.NVarChar, name);
  request.input("passwordHash", sql.NVarChar, hashPassword(password));

  const roleResult = await request.query(`
    SELECT TOP 1 id
    FROM dbo.roles
    WHERE codigo = 'admin'
  `);

  const roleId = roleResult.recordset[0]?.id;
  if (!roleId) {
    throw new Error("No existe el rol admin en dbo.roles.");
  }

  const passwordUpdatedAtResult = await pool
    .request()
    .query(`
      SELECT CASE WHEN COL_LENGTH('dbo.usuarios', 'password_updated_at') IS NULL THEN 0 ELSE 1 END AS has_column
    `);
  const hasPasswordUpdatedAt = Boolean(passwordUpdatedAtResult.recordset[0]?.has_column);

  const userResult = await pool
    .request()
    .input("email", sql.NVarChar, email.toLowerCase())
    .query("SELECT TOP 1 id FROM dbo.usuarios WHERE email = @email");

  if (userResult.recordset[0]) {
    await pool
      .request()
      .input("email", sql.NVarChar, email.toLowerCase())
      .input("name", sql.NVarChar, name)
      .input("passwordHash", sql.NVarChar, hashPassword(password))
      .input("roleId", sql.Int, roleId)
      .query(`
        UPDATE dbo.usuarios
        SET nombre = @name,
            password_hash = @passwordHash,
            rol_id = @roleId,
            activo = 1,
            updated_at = SYSDATETIME()
            ${hasPasswordUpdatedAt ? ", password_updated_at = SYSDATETIME()" : ""}
        WHERE email = @email
      `);
    console.log(`Usuario administrador actualizado: ${email}`);
  } else {
    await pool
      .request()
      .input("email", sql.NVarChar, email.toLowerCase())
      .input("name", sql.NVarChar, name)
        .input("passwordHash", sql.NVarChar, hashPassword(password))
        .input("roleId", sql.Int, roleId)
        .query(`
        ${hasPasswordUpdatedAt
          ? "INSERT INTO dbo.usuarios (rol_id, nombre, email, password_hash, password_updated_at, activo)"
          : "INSERT INTO dbo.usuarios (rol_id, nombre, email, password_hash, activo)"}
        VALUES (@roleId, @name, @email, @passwordHash${hasPasswordUpdatedAt ? ", SYSDATETIME()" : ""}, 1)
      `);
    console.log(`Usuario administrador creado: ${email}`);
  }

  await pool.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
