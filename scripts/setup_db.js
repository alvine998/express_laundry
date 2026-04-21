const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    const sqlFile = path.join(__dirname, 'init_db.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL by semicolon, but handle cases where semicolons are in strings
    const statements = sql.split(/;\s*$/m).filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.end();
  }
}

setup();
