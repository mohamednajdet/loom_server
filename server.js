const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const cartRoutes = require('./routes/cartRoutes');

// ✅ إضافة sendOtp إلى مجموعة userRoutes
const sendOtpRoute = require('./routes/sendOtp');

dotenv.config();

// اتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
  });

const app = express();

app.use(cors());
app.use(express.json());

// ✅ استخدام الراوتات
app.use('/api/users', userRoutes);          // كل ما يخص المستخدمين
app.use('/api/users', sendOtpRoute);        // OTP صار ضمن المستخدمين
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);

// ✅ راوت افتراضي لفحص السيرفر
app.get('/', (req, res) => {
  res.send('Loom server is running...');
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
