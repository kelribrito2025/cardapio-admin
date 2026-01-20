import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows1] = await conn.execute('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE establishmentId = 1');
console.log('Reviews stats:', rows1[0]);

const [rows2] = await conn.execute('SELECT id, name, rating, reviewCount FROM establishments WHERE id = 1');
console.log('Establishment:', rows2[0]);

await conn.end();
