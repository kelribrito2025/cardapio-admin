import mysql from 'mysql2/promise';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  
  const conn = await mysql.createConnection(dbUrl);
  
  console.log('=== Products Images ===');
  const [products] = await conn.execute('SELECT id, name, images FROM products LIMIT 5');
  for (const p of products) {
    console.log(`Product ${p.id}: ${p.name}`);
    console.log(`  Images: ${JSON.stringify(p.images)}`);
  }
  
  console.log('\n=== Establishment Logo/Cover ===');
  const [establishments] = await conn.execute('SELECT id, name, logo, coverImage FROM establishments LIMIT 3');
  for (const e of establishments) {
    console.log(`Establishment ${e.id}: ${e.name}`);
    console.log(`  Logo: ${e.logo}`);
    console.log(`  Cover: ${e.coverImage}`);
  }
  
  await conn.end();
}

main().catch(console.error);
