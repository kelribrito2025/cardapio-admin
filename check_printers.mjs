import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar impressoras
const [printers] = await conn.execute('SELECT * FROM printers WHERE establishmentId = 30001');
console.log('=== IMPRESSORAS ===');
console.log(JSON.stringify(printers, null, 2));

// Verificar produtos com suas impressoras
const [products] = await conn.execute(`
  SELECT p.id, p.name, p.printerId, pr.name as printerName 
  FROM products p 
  LEFT JOIN printers pr ON p.printerId = pr.id 
  WHERE p.establishmentId = 30001 
  AND p.printerId IS NOT NULL
  LIMIT 10
`);
console.log('\n=== PRODUTOS COM IMPRESSORA DEFINIDA ===');
console.log(JSON.stringify(products, null, 2));

// Verificar último pedido
const [lastOrder] = await conn.execute(`
  SELECT o.id, o.orderNumber, o.status, oi.productId, oi.productName, p.printerId
  FROM orders o
  JOIN order_items oi ON o.id = oi.orderId
  LEFT JOIN products p ON oi.productId = p.id
  WHERE o.establishmentId = 30001
  ORDER BY o.id DESC
  LIMIT 5
`);
console.log('\n=== ÚLTIMO PEDIDO COM ITENS ===');
console.log(JSON.stringify(lastOrder, null, 2));

await conn.end();
