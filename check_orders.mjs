import 'dotenv/config';
import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, establishmentId, status, customerName, total, createdAt FROM orders ORDER BY createdAt DESC LIMIT 10');
console.log('Pedidos no banco:');
console.table(rows);
await conn.end();
