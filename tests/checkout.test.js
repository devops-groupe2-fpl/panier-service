const request = require('supertest');
const app = require('../src/app');
const { resetCarts } = require('../src/routes/cart');
const catalogue = require('../src/catalogueClient');
const commandes = require('../src/commandesClient');

jest.mock('../src/catalogueClient');
jest.mock('../src/commandesClient');

const CLAVIER = { id: 1, name: 'Clavier', price: 25.5 };
const ORDER = { orderId: 12, status: 'pending', createdAt: '2026-11-15T12:00:00Z' };

beforeEach(() => {
  resetCarts();
  catalogue.getProduct.mockReset();
  commandes.createOrder.mockReset();
  catalogue.getProduct.mockResolvedValue(CLAVIER);
});

describe('POST /cart/:userId/checkout', () => {
  test('panier vide -> 400', async () => {
    const res = await request(app).post('/cart/user1/checkout');
    expect(res.status).toBe(400);
    expect(commandes.createOrder).not.toHaveBeenCalled();
  });

  test('envoie le bon format à Commandes, répond 201 et vide le panier', async () => {
    commandes.createOrder.mockResolvedValue(ORDER);
    await request(app).post('/cart/user1/add').send({ productId: 1, quantity: 2 });

    const res = await request(app).post('/cart/user1/checkout');

    expect(res.status).toBe(201);
    expect(res.body).toEqual(ORDER);
    expect(commandes.createOrder).toHaveBeenCalledWith({
      userId: 'user1',
      items: [{ productId: 1, name: 'Clavier', quantity: 2, unitPrice: 25.5 }],
      totalAmount: 51,
    });

    const cart = await request(app).get('/cart/user1');
    expect(cart.body.items).toEqual([]);
  });

  test('Commandes en panne -> 502 et le panier est conservé', async () => {
    commandes.createOrder.mockRejectedValue(new Error('injoignable'));
    await request(app).post('/cart/user1/add').send({ productId: 1 });

    const res = await request(app).post('/cart/user1/checkout');

    expect(res.status).toBe(502);
    const cart = await request(app).get('/cart/user1');
    expect(cart.body.items).toHaveLength(1);
  });
});
