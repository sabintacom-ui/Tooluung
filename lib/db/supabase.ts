import { Pool } from "pg";
import "server-only";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL environment variable");
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  return getPool().query(text, params);
}

function parsePostgrestQueryToSql(filterStr: string, startParamIndex = 1) {
  let whereClauses: string[] = [];
  let orderBy = "";
  let limit = "";
  let selectColumns = "*";
  const values: any[] = [];
  let paramIndex = startParamIndex;

  if (!filterStr) {
    return { selectColumns, where: "", orderBy, limit, values, nextParamIndex: paramIndex };
  }

  const params = filterStr.split("&");
  for (const p of params) {
    if (!p) continue;
    if (p.startsWith("select=")) {
      const cols = p.slice("select=".length);
      if (cols && cols !== "*") {
        selectColumns = cols;
      }
    } else if (p.startsWith("order=")) {
      const parts = p.slice("order=".length).split(".");
      const field = parts[0];
      const dir = parts[1]?.toUpperCase() || "ASC";
      if (/^[a-zA-Z0-9_]+$/.test(field) && (dir === "ASC" || dir === "DESC")) {
        orderBy = `ORDER BY ${field} ${dir}`;
      }
    } else if (p.startsWith("limit=")) {
      const val = parseInt(p.slice("limit=".length), 10);
      if (!isNaN(val)) limit = `LIMIT ${val}`;
    } else if (p.startsWith("or=")) {
      // e.g. or=(locked_at.is.null,locked_at.lt.cutoff)
      const content = p.slice("or=(".length, -1);
      const parts = content.split(",");
      const subClauses: string[] = [];
      for (const part of parts) {
        if (part.endsWith(".is.null")) {
          const field = part.slice(0, -".is.null".length);
          if (/^[a-zA-Z0-9_]+$/.test(field)) {
            subClauses.push(`${field} IS NULL`);
          }
        } else if (part.includes(".lt.")) {
          const [field, val] = part.split(".lt.");
          if (/^[a-zA-Z0-9_]+$/.test(field)) {
            subClauses.push(`${field} < $${paramIndex}`);
            values.push(decodeURIComponent(val));
            paramIndex++;
          }
        }
      }
      if (subClauses.length > 0) {
        whereClauses.push(`(${subClauses.join(" OR ")})`);
      }
    } else if (p.includes("=eq.")) {
      const [field, val] = p.split("=eq.");
      if (/^[a-zA-Z0-9_]+$/.test(field)) {
        whereClauses.push(`${field} = $${paramIndex}`);
        values.push(decodeURIComponent(val));
        paramIndex++;
      }
    } else if (p.includes("=in.")) {
      const [field, rawList] = p.split("=in.");
      if (/^[a-zA-Z0-9_]+$/.test(field)) {
        const list = rawList.slice(1, -1).split(",");
        const placeholders = list.map(() => {
          const ph = `$${paramIndex}`;
          paramIndex++;
          return ph;
        });
        values.push(...list.map(v => decodeURIComponent(v)));
        whereClauses.push(`${field} IN (${placeholders.join(", ")})`);
      }
    }
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  return { selectColumns, where, orderBy, limit, values, nextParamIndex: paramIndex };
}

export async function insertRow<T extends Record<string, any>>(table: string, row: Record<string, any>): Promise<T> {
  const keys = Object.keys(row);
  const values = Object.values(row);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  
  if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error(`Invalid table name: ${table}`);
  for (const k of keys) {
    if (!/^[a-zA-Z0-9_]+$/.test(k)) throw new Error(`Invalid column name: ${k}`);
  }

  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const result = await query(sql, values);
  return result.rows[0] as T;
}

export async function selectRows<T extends Record<string, any>>(table: string, queryStr: string): Promise<T[]> {
  if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error(`Invalid table name: ${table}`);
  const { selectColumns, where, orderBy, limit, values } = parsePostgrestQueryToSql(queryStr);
  
  let selectFields = "*";
  if (selectColumns !== "*") {
    const fields = selectColumns.split(",").map(f => f.trim());
    for (const f of fields) {
      if (!/^[a-zA-Z0-9_*()]+$/.test(f)) throw new Error(`Invalid column selection: ${f}`);
    }
    selectFields = fields.join(", ");
  }

  const sql = `SELECT ${selectFields} FROM ${table} ${where} ${orderBy} ${limit}`.trim();
  const result = await query(sql, values);
  return result.rows as T[];
}

export async function selectOne<T extends Record<string, any>>(table: string, queryStr: string): Promise<T | null> {
  let q = queryStr;
  if (!q.includes("limit=")) {
    q += (q.includes("&") || q.includes("=") ? "&" : "") + "limit=1";
  }
  const rows = await selectRows<T>(table, q);
  return rows[0] ?? null;
}

export async function updateRows<T extends Record<string, any>>(
  table: string,
  queryStr: string,
  patch: Record<string, any>
): Promise<T[]> {
  if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error(`Invalid table name: ${table}`);
  
  const patchKeys = Object.keys(patch);
  const patchValues = Object.values(patch);
  
  if (patchKeys.length === 0) {
    return selectRows<T>(table, queryStr);
  }

  const setClauses: string[] = [];
  let paramIndex = 1;
  const values: any[] = [];

  for (let i = 0; i < patchKeys.length; i++) {
    const k = patchKeys[i];
    if (!/^[a-zA-Z0-9_]+$/.test(k)) throw new Error(`Invalid column name: ${k}`);
    setClauses.push(`${k} = $${paramIndex}`);
    values.push(patchValues[i]);
    paramIndex++;
  }

  const { where, values: queryValues } = parsePostgrestQueryToSql(queryStr, paramIndex);
  values.push(...queryValues);

  const sql = `UPDATE ${table} SET ${setClauses.join(", ")} ${where} RETURNING *`;
  const result = await query(sql, values);
  return result.rows as T[];
}

export async function rpc<T>(fn: string, body: Record<string, any> = {}): Promise<T> {
  if (!/^[a-zA-Z0-9_]+$/.test(fn)) throw new Error(`Invalid RPC name: ${fn}`);
  
  if (fn === "claim_next_pipeline_job") {
    const sql = `SELECT * FROM claim_next_pipeline_job($1)`;
    const result = await query(sql, [body.worker_id]);
    return result.rows as unknown as T;
  }
  
  throw new Error(`Unsupported RPC function: ${fn}`);
}

export async function claimNextPipelineJobFallback<T extends Record<string, any>>(workerId: string): Promise<T[]> {
  const staleCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const queryStr =
    `status=in.(pending,running)` +
    `&or=(locked_at.is.null,locked_at.lt.${encodeURIComponent(staleCutoff)})` +
    `&order=created_at.asc&limit=1&select=id`;
  
  const candidates = await selectRows<{ id: string }>("pipeline_jobs", queryStr);
  const candidate = candidates[0];
  if (!candidate) return [];

  const now = new Date().toISOString();
  const updateQuery =
    `id=eq.${encodeURIComponent(candidate.id)}` +
    `&or=(locked_at.is.null,locked_at.lt.${encodeURIComponent(staleCutoff)})`;
    
  const updated = await updateRows<T>("pipeline_jobs", updateQuery, {
    status: "running",
    locked_at: now,
    locked_by: workerId,
    updated_at: now,
  });
  return updated;
}
