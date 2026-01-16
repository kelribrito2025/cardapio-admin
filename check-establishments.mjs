import { createConnection } from 'mysql2/promise';

const connection = await createConnection({
  host: process.env.DATABASE_HOST || 'gateway01.us-west-2.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DATABASE_PORT || '4000'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: true }
});

const [rows] = await connection.execute('SELECT id, userId, name, menuSlug, rating, reviewCount FROM establishments');
console.log(JSON.stringify(rows, null, 2));
await connection.end();
