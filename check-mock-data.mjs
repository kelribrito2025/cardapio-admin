import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(dbUrl);

const [rows] = await conn.execute(
  "SELECT orderNumber, status, establishmentId, DATE(createdAt) as dt, DATE(completedAt) as completedDt, deliveryType FROM orders WHERE orderNumber LIKE '9901%' LIMIT 20"
);
console.log('Mock orders:');
rows.forEach(r => console.log(`  ${r.orderNumber} | status=${r.status} | estId=${r.establishmentId} | created=${r.dt} | completed=${r.completedDt} | type=${r.deliveryType}`));

const [items] = await conn.execute(
  "SELECT oi.orderId, oi.productName, oi.quantity FROM order_items oi INNER JOIN orders o ON oi.orderId = o.id WHERE o.orderNumber LIKE '9901%' LIMIT 20"
);
console.log('Mock items:');
items.forEach(i => console.log(`  orderId=${i.orderId} | ${i.productName} x${i.quantity}`));

await conn.end();
