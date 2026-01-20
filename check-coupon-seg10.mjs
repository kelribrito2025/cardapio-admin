import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  'SELECT * FROM coupons WHERE code = ?',
  ['SEG10']
);

console.log('Cupons encontrados:', rows.length);
rows.forEach((row, i) => {
  console.log(`\n--- Cupom ${i + 1} ---`);
  console.log('ID:', row.id);
  console.log('Code:', row.code);
  console.log('EstablishmentId:', row.establishmentId);
  console.log('Type:', row.type);
  console.log('Value:', row.value);
  console.log('Status:', row.status);
  console.log('StartDate:', row.startDate);
  console.log('EndDate:', row.endDate);
  console.log('ActiveDays:', row.activeDays);
  console.log('ValidOrigins:', row.validOrigins);
  console.log('StartTime:', row.startTime);
  console.log('EndTime:', row.endTime);
  console.log('MinOrderValue:', row.minOrderValue);
  console.log('MaxDiscount:', row.maxDiscount);
});

await connection.end();
