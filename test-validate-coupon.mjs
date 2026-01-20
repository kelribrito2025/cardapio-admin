// Simular a chamada à API de validação de cupom
const establishmentId = 30001;
const code = 'SEG10';
const orderValue = 75.80;
const deliveryType = 'delivery';

// tRPC queries esperam o input em formato JSON com chave "json"
const url = `http://localhost:3000/api/trpc/publicMenu.validateCoupon?input=${encodeURIComponent(JSON.stringify({
  json: {
    establishmentId,
    code,
    orderValue,
    deliveryType,
  }
}))}`;

console.log('URL:', url);
console.log('');

try {
  const response = await fetch(url);
  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
