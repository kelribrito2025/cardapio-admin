import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar cupom SEG10 do estabelecimento 30001
const [coupons] = await connection.execute(
  'SELECT * FROM coupons WHERE code = ? AND establishmentId = ?',
  ['SEG10', 30001]
);

console.log('Cupom SEG10 do estabelecimento 30001:');
if (coupons.length === 0) {
  console.log('  Cupom não encontrado!');
} else {
  const c = coupons[0];
  console.log('  ID:', c.id);
  console.log('  Code:', c.code);
  console.log('  EstablishmentId:', c.establishmentId);
  console.log('  Type:', c.type);
  console.log('  Value:', c.value);
  console.log('  Status:', c.status);
  console.log('  StartDate:', c.startDate);
  console.log('  EndDate:', c.endDate);
  console.log('  ActiveDays:', c.activeDays);
  console.log('  ValidOrigins:', c.validOrigins);
  console.log('  StartTime:', c.startTime);
  console.log('  EndTime:', c.endTime);
  console.log('  MinOrderValue:', c.minOrderValue);
  console.log('  MaxDiscount:', c.maxDiscount);
  console.log('  Quantity:', c.quantity);
  console.log('  UsedCount:', c.usedCount);
  
  // Simular validação
  console.log('\n--- Simulação de Validação ---');
  const now = new Date();
  console.log('Data/hora atual:', now.toISOString());
  
  // Status
  console.log('Status é active?', c.status === 'active');
  
  // Valor mínimo
  const orderValue = 75.80; // valor do pedido da imagem
  console.log('Valor do pedido:', orderValue);
  console.log('Valor mínimo:', c.minOrderValue);
  console.log('Pedido atinge mínimo?', c.minOrderValue === null || orderValue >= Number(c.minOrderValue));
  
  // Datas
  console.log('StartDate:', c.startDate);
  console.log('EndDate:', c.endDate);
  if (c.startDate) {
    console.log('Após startDate?', now >= c.startDate);
  }
  if (c.endDate) {
    const endOfDay = new Date(c.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    console.log('Antes de endDate (23:59:59)?', now <= endOfDay);
  }
  
  // Dias ativos
  console.log('ActiveDays:', c.activeDays);
  if (c.activeDays) {
    const dayNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const today = dayNames[now.getDay()];
    console.log('Dia atual:', today);
    console.log('Dia está nos dias ativos?', c.activeDays.includes(today));
  }
  
  // Origens válidas
  console.log('ValidOrigins:', c.validOrigins);
}

await connection.end();
