import type { AuthSession } from "@/lib/auth-types";
import sql from "mssql";

type Scope = {
  clause: string;
  bind: (request: sql.Request) => void;
};

export function buildTenantScope(session: AuthSession, alias: string): Scope {
  if (session.isAdmin) {
    return {
      clause: "1 = 1",
      bind: () => undefined,
    };
  }

  if (session.companyIds.length === 0) {
    return {
      clause: "1 = 0",
      bind: () => undefined,
    };
  }

  return {
    clause: `EXISTS (
      SELECT 1
      FROM STRING_SPLIT(@companyIds, ',') scope_ids
      WHERE TRY_CAST(scope_ids.value AS INT) = ${alias}
    )`,
    bind: (request) => {
      request.input("companyIds", sql.NVarChar, session.companyIds.join(","));
    },
  };
}

export function bindCompanyIds(request: sql.Request, session: AuthSession) {
  if (!session.isAdmin && session.companyIds.length > 0) {
    request.input("companyIds", sql.NVarChar, session.companyIds.join(","));
  }
}

export function canAccessCompany(session: AuthSession, companyId: number) {
  return session.isAdmin || session.companyIds.includes(companyId);
}

export function requireCompanyAccess(session: AuthSession, companyId: number) {
  if (!canAccessCompany(session, companyId)) {
    throw new Error("FORBIDDEN");
  }
}
