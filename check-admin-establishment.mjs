import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar usuário admin@admin.com
const [users] = await connection.execute(
  'SELECT id, openId, name, email FROM users WHERE email = ?',
  ['admin@admin.com']
);

console.log('Usuário admin@admin.com:');
users.forEach(u => {
  console.log(`  ID: ${u.id}, OpenId: ${u.openId}, Nome: ${u.name}, Email: ${u.email}`);
});

if (users.length > 0) {
  const userId = users[0].id;
  
  // Verificar estabelecimentos vinculados a este usuário (campo é userId, não ownerId)
  const [establishments] = await connection.execute(
    'SELECT * FROM establishments WHERE userId = ?',
    [userId]
  );
  
  console.log('\nEstabelecimentos do usuário (userId=' + userId + '):');
  if (establishments.length === 0) {
    console.log('  Nenhum estabelecimento encontrado!');
    
    // Verificar todos os estabelecimentos para entender a estrutura
    const [allEst] = await connection.execute(
      'SELECT id, name, userId FROM establishments'
    );
    console.log('\nTodos os estabelecimentos:');
    allEst.forEach(e => {
      console.log(`  ID: ${e.id}, Nome: ${e.name}, UserId: ${e.userId}`);
    });
  } else {
    establishments.forEach(e => {
      console.log(`  ID: ${e.id}, Nome: ${e.name}, UserId: ${e.userId}`);
    });
  }
}

// Verificar cupons SEG10 novamente
const [coupons] = await connection.execute(
  'SELECT id, code, establishmentId, status FROM coupons WHERE code = ?',
  ['SEG10']
);

console.log('\nCupons SEG10:');
coupons.forEach(c => {
  console.log(`  ID: ${c.id}, EstablishmentId: ${c.establishmentId}, Status: ${c.status}`);
});

await connection.end();
