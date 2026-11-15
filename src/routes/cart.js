const express = require('express');
const catalogue = require('../catalogueClient');
const commandes = require('../commandesClient');

const router = express.Router();
const carts = new Map(); // userId -> Map(productId -> item)

function formatCart(userId) {
  const items = carts.has(userId) ? [...carts.get(userId).values()] : [];
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  return { userId, items, totalAmount: Math.round(total * 100) / 100 };
}

// Consulter le panier
router.get('/:userId', (req, res) => {
  res.json(formatCart(req.params.userId));
});

// Ajouter un produit
router.post('/:userId/add', async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity = 1 } = req.body || {};

  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'productId et quantity (entier >= 1) sont obligatoires' });
  }

  try {
    const product = await catalogue.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: `Produit ${productId} introuvable` });
    }

    if (!carts.has(userId)) carts.set(userId, new Map());
    const cart = carts.get(userId);
    const key = String(productId);

    if (cart.has(key)) {
      cart.get(key).quantity += quantity;
    } else {
      cart.set(key, {
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: Number(product.price),
      });
    }
    res.json(formatCart(userId));
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// Retirer un produit
router.delete('/:userId/remove/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const cart = carts.get(userId);

  if (!cart || !cart.delete(productId)) {
    return res.status(404).json({ error: `Produit ${productId} absent du panier` });
  }
  res.json(formatCart(userId));
});

// Valider le panier : envoyer à Commandes, puis vider le panier
router.post('/:userId/checkout', async (req, res) => {
  const { userId } = req.params;
  const cart = formatCart(userId);

  if (cart.items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide' });
  }

  try {
    const order = await commandes.createOrder(cart);
    carts.delete(userId);
    res.status(201).json(order);
  } catch (err) {
    res.status(502).json({ error: 'Service Commandes indisponible' });
  }
});

module.exports = { router, resetCarts: () => carts.clear() };
