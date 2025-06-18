require('dotenv').config(); // الأفضل يكون بأول سطر

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const cartRoutes = require('./routes/cartRoutes');
const sendOtpRoutes = require('./routes/sendOtp');
const mapboxRoutes = require('./routes/mapboxRoutes');
const addressRoutes = require('./routes/addressRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes'); // ✅ راوت الشكاوى
const surveyRoutes = require('./routes/surveyRoutes'); // ✅  راوت الاستبيانات


const app = express();

// ✅ الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((error) => console.error('❌ MongoDB connection failed:', error));

app.use(cors());
app.use(express.json());

// ✅ الراوتات الرئيسية
app.use('/api/users', userRoutes);           // المستخدمين
app.use('/api/users', sendOtpRoutes);        // OTP
app.use('/api/products', productRoutes);     // المنتجات
app.use('/api/orders', orderRoutes);         // الطلبات
app.use('/api/favorites', favoriteRoutes);   // المفضلة
app.use('/api/admin', adminRoutes);          // الأدمن
app.use('/api/upload', uploadRoutes);        // رفع الصور
app.use('/api/cart', cartRoutes);            // السلة
app.use('/api/mapbox', mapboxRoutes);        // خريطة
app.use('/api/addresses', addressRoutes);    // العناوين
app.use('/api/feedback', feedbackRoutes);    // ✅ الشكاوى والاقتراحات
app.use('/api/surveys', surveyRoutes); // لاحظ جمع surveys


// ✅ فحص السيرفر
app.get('/', (req, res) => {
  res.send('Loom server is running...');
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
