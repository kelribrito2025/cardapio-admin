import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const [result] = await connection.execute(
    `SELECT p.id, p.name, p.establishmentId, e.menuSlug 
     FROM products p 
     JOIN establishments e ON p.establishmentId = e.id 
     WHERE p.id = 60004`
  );
  
  console.log('Resultado:', result);
  
  await connection.end();
}

main().catch(console.error);
