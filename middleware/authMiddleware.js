// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// ✅ ميدل وير للتحقق من التوكن JWT في الهيدر
const verifyUser = (req, res, next) => {
  // استخراج التوكن من الهيدر
  const token = req.headers.authorization?.split(' ')[1];

  // التحقق من وجود التوكن
  if (!token) {
    return res.status(401).json({ message: 'توكن غير موجود' });
  }

  try {
    // التحقق من صلاحية التوكن واستخراج بيانات المستخدم
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // حفظ userId داخل req لاستخدامه لاحقًا في الراوت
    next(); // الانتقال للراوت التالي
  } catch {
    res.status(403).json({ message: 'توكن غير صالح' });
  }
};

module.exports = { verifyUser };
