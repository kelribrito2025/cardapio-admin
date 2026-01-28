import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar produto específico
const [product] = await conn.execute(`
  SELECT p.id, p.name, p.printerId, pr.name as printerName, pr.ipAddress, pr.isActive
  FROM products p 
  LEFT JOIN printers pr ON p.printerId = pr.id 
  WHERE p.id = 120069
`);
console.log('=== PRODUTO 120069 ===');
console.log(JSON.stringify(product, null, 2));

// Verificar todas as impressoras
const [printers] = await conn.execute('SELECT id, name, ipAddress, isActive FROM printers WHERE establishmentId = 30001');
console.log('\n=== TODAS AS IMPRESSORAS ===');
console.log(JSON.stringify(printers, null, 2));

// Verificar último pedido com esse produto
const [lastOrder] = await conn.execute(`
  SELECT o.id, o.orderNumber, o.status, oi.id as itemId, oi.productId, oi.productName, p.printerId
  FROM orders o
  JOIN order_items oi ON o.id = oi.orderId
  LEFT JOIN products p ON oi.productId = p.id
  WHERE o.establishmentId = 30001
  ORDER BY o.id DESC
  LIMIT 5
`);
console.log('\n=== ÚLTIMOS PEDIDOS ===');
console.log(JSON.stringify(lastOrder, null, 2));

await conn.end();
