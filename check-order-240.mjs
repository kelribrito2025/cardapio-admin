import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: process.env.MYSQL_USER || 'enmwmxpat34diouyku4te2.root',
  password: process.env.MYSQL_PASSWORD || 'QLfWLCqyP2BFYqLT',
  database: process.env.MYSQL_DATABASE || 'enmwmxpat34diouyku4te2',
  ssl: { rejectUnauthorized: true }
});

// Buscar pedido P240
const [orders] = await connection.execute(`
  SELECT id, orderNumber, total, customerName
  FROM orders 
  WHERE orderNumber = '240' AND establishmentId = 30001
`);

console.log('Pedido P240:', orders);

if (orders.length > 0) {
  const orderId = orders[0].id;
  
  // Buscar itens do pedido
  const [items] = await connection.execute(`
    SELECT id, productName, quantity, unitPrice, totalPrice, complements
    FROM orderItems 
    WHERE orderId = ?
  `, [orderId]);
  
  console.log('\nItens do pedido:');
  items.forEach(item => {
    console.log(`- ${item.productName}: ${item.quantity}x R$${item.unitPrice} = R$${item.totalPrice}`);
    console.log('  Complementos:', item.complements);
  });
}

await connection.end();
