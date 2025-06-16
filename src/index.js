const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importera Swagger
const setupSwagger = require('./swagger');

// Importera routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Swagger-dokumentation
setupSwagger(app);

// API-rutter
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Test-route för att kolla att API är igång
app.get('/', (req, res) => {
  res.send('✅ API är igång!');
});

// 404-fallback för rutter som inte finns
app.use((req, res) => {
  res.status(404).json({ error: 'Sidan hittades inte' });
});

// Global felhanterare
app.use((err, req, res, next) => {
  console.error('❌ Serverfel:', err);
  res.status(500).json({ error: 'Internt serverfel' });
});

// Starta servern
app.listen(PORT, () => {
  console.log(`🚀 Servern körs på http://localhost:${PORT}`);
});
