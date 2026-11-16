import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const database = process.env.DB_NAME || 'hills_angels';

export const sequelize = process.env.MYSQL_URI || process.env.DATABASE_URL
  ? new Sequelize(process.env.MYSQL_URI || process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? false : false,
      define: {
        timestamps: true,
      },
    })
  : new Sequelize(database, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
      define: {
        timestamps: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

export const connectDB = async () => {
  try {
    // 1. Ensure MySQL database exists (using root or configured user)
    if (!process.env.MYSQL_URI && !process.env.DATABASE_URL) {
      try {
        const connection = await mysql.createConnection({
          host,
          port,
          user,
          password,
        });
        await connection.query(
          `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        await connection.end();
      } catch (dbInitErr) {
        console.warn(`[DB] Notice during database pre-check: ${dbInitErr.message}`);
      }
    }

    // 2. Authenticate Sequelize
    console.log(`[DB] Connecting to MySQL database "${database}" at ${host}:${port}...`);
    await sequelize.authenticate();
    console.log(`[DB] ✅ Connected to MySQL database "${database}" successfully.`);

    // 3. Sync all models safely (only create missing tables; never alter or duplicate existing indexes)
    if (process.env.NODE_ENV !== 'production' || process.env.AUTO_SYNC_DB === 'true') {
      try {
        await sequelize.sync({ alter: false });
        console.log('[DB] ✅ All Sequelize models synchronized with MySQL tables.');
      } catch (syncErr) {
        console.warn('[DB] Sync notice:', syncErr.message);
      }
    } else {
      console.log('[DB] Production mode: Auto-sync disabled (use migration scripts).');
    }

    return sequelize;
  } catch (err) {
    if (err.name === 'SequelizeConnectionRefusedError' || err.code === 'ECONNREFUSED') {
      console.error(
        `\n[DB] ❌ Could not connect to MySQL at ${host}:${port}.\n` +
          '   Please ensure MySQL is running (e.g. start MySQL in XAMPP, WampServer, Docker, or Windows Services).\n' +
          `   Database: "${database}" | User: "${user}"\n`
      );
    } else {
      console.error(`[DB] ❌ MySQL Connection Error: ${err.message}`);
    }
    throw err;
  }
};

export const disconnectDB = async () => {
  try {
    await sequelize.close();
    console.log('[DB] Disconnected from MySQL database');
  } catch (err) {
    console.error('[DB] Error during disconnect:', err.message);
  }
};

export default sequelize;
