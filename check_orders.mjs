import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, orderNumber, status FROM orders LIMIT 10');
console.log('Pedidos encontrados:', rows);
await conn.end();
