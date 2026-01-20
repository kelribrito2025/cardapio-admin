import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Primeiro, vamos ver qual é o establishmentId correto
const [establishments] = await connection.execute(
  'SELECT id, name FROM establishments'
);

console.log('Estabelecimentos:');
establishments.forEach(e => {
  console.log(`  ID: ${e.id}, Nome: ${e.name}`);
});

// Agora vamos ver os cupons
const [coupons] = await connection.execute(
  'SELECT id, code, establishmentId, status FROM coupons WHERE code = ?',
  ['SEG10']
);

console.log('\nCupons SEG10:');
coupons.forEach(c => {
  console.log(`  ID: ${c.id}, EstablishmentId: ${c.establishmentId}, Status: ${c.status}`);
});

// Verificar se o establishmentId do cupom corresponde ao estabelecimento
console.log('\n--- Análise ---');
const couponEstIds = coupons.map(c => c.establishmentId);
const estIds = establishments.map(e => e.id);

couponEstIds.forEach(ceid => {
  const match = estIds.includes(ceid);
  console.log(`Cupom com establishmentId ${ceid}: ${match ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} nos estabelecimentos`);
});

await connection.end();
