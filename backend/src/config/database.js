const mysql = require('mysql2/promise');

function parseDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const url = new URL(process.env.DATABASE_URL);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
  };
}

function resolveConfig() {
  const urlConfig = parseDatabaseUrl();
  if (urlConfig) {
    return urlConfig;
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eduauth_registry',
  };
}

const pool = mysql.createPool({
  ...resolveConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const db = {
      query: async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        return rows;
      },
      execute: async (sql, params = []) => {
        const [result] = await connection.execute(sql, params);
        return result;
      },
      connection,
    };
    const result = await callback(db);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  execute,
  transaction,
};
