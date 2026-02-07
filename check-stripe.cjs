const Stripe = require('stripe');
const s = new Stripe('sk_test_dummy');
console.log('v2:', !!s.v2);
console.log('v2.core:', !!s.v2?.core);
console.log('v2.core.accounts:', !!s.v2?.core?.accounts);
console.log('accounts v1:', !!s.accounts);
console.log('accountLinks v1:', !!s.accountLinks);
console.log('checkout.sessions:', !!s.checkout?.sessions);
console.log('parseThinEvent:', typeof s.parseThinEvent);
