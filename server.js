require('dotenv').config();           // 1) حمِّل المتغيرات أوّل شيء

// 2) Firebase Admin ─ قبل أي شيء يحتاج FCM
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const morgan    = require('morgan');          // (اختياري) لعمل لوجات HTTP

/* ──────────────────────── 3) استيراد الراوتات ─────────────────────── */
const userRoutes        = require('./routes/userRoutes');
const productRoutes     = require('./routes/productRoutes');
const orderRoutes       = require('./routes/orderRoutes');
const favoriteRoutes    = require('./routes/favoriteRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const uploadRoutes      = require('./routes/uploadRoutes');
const cartRoutes        = require('./routes/cartRoutes');
const sendOtpRoutes     = require('./routes/sendOtp');
const mapboxRoutes      = require('./routes/mapboxRoutes');
const addressRoutes     = require('./routes/addressRoutes');
const feedbackRoutes    = require('./routes/feedbackRoutes');
const surveyRoutes      = require('./routes/surveyRoutes');
const notificationRoutes= require('./routes/notificationRoutes');

const app = express();

/* ───────────────── 4) اتصال احترافي بـ MongoDB Atlas ─────────────── */
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // هذه الخيارات تُجنِّب رسائل تحذير deprecation
      useNewUrlParser   : true,
      useUnifiedTopology: true,
      // اختياري: أعد المحاولة تلقائياً عند انقطاع الاتصال
      autoIndex         : false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);                 // أخرُج إن فشل الاتصال (مهم لـ PM2)
  }
})();

/* ───────────────────── 5) Middlewares عامّة ─────────────────────── */
app.use(cors({ origin: '*' }));      // خصّص origin إن أردت
app.use(express.json({ limit: '10mb' }));
app.use(morgan('tiny'));             // (اختياري)

/* ───────────────────── 6) الراوتات الرئيسيــــة ──────────────────── */
app.use('/api/users',       userRoutes);
app.use('/api/users',       sendOtpRoutes);
app.use('/api/products',    productRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/favorites',   favoriteRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/upload',      uploadRoutes);
app.use('/api/cart',        cartRoutes);
app.use('/api/mapbox',      mapboxRoutes);
app.use('/api/addresses',   addressRoutes);
app.use('/api/feedback',    feedbackRoutes);
app.use('/api/surveys',     surveyRoutes);
app.use('/api/notifications', notificationRoutes);

/* ───────────── 7) Health-Check بسيط (اختياري) ───────────── */
app.get('/', (_, res) => res.send('Loom server is running...'));

/* ───────────── 8) Global Error Handling (اختياري) ────────── */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

/* ───────────────────── 9) تشغيل الخــــادم ─────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

/* ───────────── 10) التصرّف مع الأخطاء غير الملتقطة ───────────── */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException',  (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
