import { createConnection } from 'mysql2/promise';

const connection = await createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '4000'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true }
});

const [rows] = await connection.execute('SELECT * FROM coupons WHERE UPPER(code) = ?', ['SEG10']);
console.log('Cupom SEG10:', JSON.stringify(rows, null, 2));

await connection.end();
