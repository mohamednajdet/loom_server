const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'توكن غير موجود' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'صلاحيات غير كافية (مو أدمن)' });
    }

    req.user = decoded; // نمرر معلومات المستخدم للراوتات الجاية
    next();
  } catch {
    res.status(403).json({ message: 'توكن غير صالح' });
  }
};

module.exports = verifyAdmin;
