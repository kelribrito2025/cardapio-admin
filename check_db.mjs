import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.DATABASE_URL);
const [rows] = await pool.execute('SELECT id, orderNumber, establishmentId, status, customerName, total, createdAt FROM orders ORDER BY id DESC');

console.log('Pedidos no banco:');
rows.forEach(o => {
  console.log(`ID: ${o.id}, Número: ${o.orderNumber}, Est: ${o.establishmentId}, Status: ${o.status}, Cliente: ${o.customerName}, Total: ${o.total}, Criado: ${o.createdAt}`);
});

await pool.end();
