const request = require('supertest');
const app = require('../src/app');
const { resetCarts } = require('../src/routes/cart');
const catalogue = require('../src/catalogueClient');

// On remplace le vrai Catalogue par un faux
jest.mock('../src/catalogueClient');

const CLAVIER = { id: 1, name: 'Clavier', price: 25.5 };

beforeEach(() => {
  resetCarts();
  catalogue.getProduct.mockReset();
  catalogue.getProduct.mockImplementation(async (id) =>
    String(id) === '1' ? CLAVIER : null
  );
});

describe('GET /health', () => {
  test('répond 200 et status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /cart/:userId', () => {
  test('panier vide -> items [] et totalAmount 0', async () => {
    const res = await request(app).get('/cart/user1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user1', items: [], totalAmount: 0 });
  });
});

describe('POST /cart/:userId/add', () => {
  test('ajout d\'un nouveau produit -> quantity = 1', async () => {
    const res = await request(app).post('/cart/user1/add').send({ productId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(1);
  });

  test('ajout d\'un produit déjà présent -> quantity + 1', async () => {
    await request(app).post('/cart/user1/add').send({ productId: 1 });
    const res = await request(app).post('/cart/user1/add').send({ productId: 1 });
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.totalAmount).toBe(51);
  });

  test('ajout avec une quantité précise', async () => {
    const res = await request(app).post('/cart/user1/add').send({ productId: 1, quantity: 3 });
    expect(res.body.items[0].quantity).toBe(3);
    expect(res.body.totalAmount).toBe(76.5);
  });

  test('produit inconnu du Catalogue -> 404', async () => {
    const res = await request(app).post('/cart/user1/add').send({ productId: 99 });
    expect(res.status).toBe(404);
  });

  test('données invalides -> 400', async () => {
    const res = await request(app).post('/cart/user1/add').send({ quantity: 2 });
    expect(res.status).toBe(400);
  });

  test('Catalogue en panne -> 500', async () => {
    catalogue.getProduct.mockRejectedValue(new Error('Catalogue injoignable'));
    const res = await request(app).post('/cart/user1/add').send({ productId: 1 });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /cart/:userId/remove/:productId', () => {
  test('retrait d\'un produit existant', async () => {
    await request(app).post('/cart/user1/add').send({ productId: 1 });
    const res = await request(app).delete('/cart/user1/remove/1');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('retrait d\'un produit absent -> 404', async () => {
    const res = await request(app).delete('/cart/user1/remove/99');
    expect(res.status).toBe(404);
  });
});
