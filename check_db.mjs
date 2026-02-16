import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/cardapio-admin/.env' });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const estId = 30001;
console.log('Establishment ID:', estId);

async function safeQuery(label, sql, params) {
  try {
    const [rows] = await conn.query(sql, params);
    console.log(label, rows);
  } catch(e) {
    console.log(label, 'ERROR:', e.message);
  }
}

async function safeCount(label, table, where) {
  try {
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM ${table} WHERE ${where}`, [estId]);
    console.log(label, rows[0].cnt);
  } catch(e) {
    console.log(label, 'TABLE NOT FOUND');
  }
}

async function safeDescribe(label, table) {
  try {
    const [cols] = await conn.query(`DESCRIBE ${table}`);
    console.log(label, cols.map(c => c.Field).join(', '));
  } catch(e) {
    console.log(label, 'TABLE NOT FOUND');
  }
}

await safeCount('Orders:', 'orders', 'establishmentId = ?');
await safeCount('Stock items:', 'stock_items', 'establishmentId = ?');
await safeCount('Drivers:', 'drivers', 'establishmentId = ?');
await safeCount('Reviews:', 'reviews', 'establishmentId = ?');
await safeCount('Scheduled orders:', 'orders', 'establishmentId = ? AND scheduledFor IS NOT NULL');
await safeCount('Categories:', 'categories', 'establishmentId = ?');
await safeCount('Products:', 'products', 'establishmentId = ?');

// List all tables
const [tables] = await conn.query("SHOW TABLES");
console.log('\nAll tables:', tables.map(t => Object.values(t)[0]).join(', '));

// Describe key tables
await safeDescribe('\nOrders columns:', 'orders');
await safeDescribe('\nDrivers columns:', 'drivers');
await safeDescribe('\nReviews columns:', 'reviews');
await safeDescribe('\nStock items columns:', 'stock_items');
await safeDescribe('\nStock categories columns:', 'stock_categories');

// Check existing order statuses
try {
  const [statuses] = await conn.query('SELECT status, COUNT(*) as cnt FROM orders WHERE establishmentId = ? GROUP BY status', [estId]);
  console.log('\nOrder statuses:', JSON.stringify(statuses));
} catch(e) {}

await conn.end();
