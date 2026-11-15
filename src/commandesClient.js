const COMMANDES_URL = process.env.COMMANDES_URL || 'http://localhost:3002';

async function createOrder(order) {
  const res = await fetch(`${COMMANDES_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(`Commandes a répondu ${res.status}`);
  return res.json();
}

module.exports = { createOrder };
