const CATALOGUE_URL = process.env.CATALOGUE_URL || 'http://localhost:3000';

async function getProduct(productId) {
  const res = await fetch(`${CATALOGUE_URL}/products/${productId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Catalogue a répondu ${res.status}`);
  return res.json();
}

module.exports = { getProduct };
