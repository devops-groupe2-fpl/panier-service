const express = require('express');
const { router: cartRouter } = require('./routes/cart');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/cart', cartRouter);

module.exports = app;
