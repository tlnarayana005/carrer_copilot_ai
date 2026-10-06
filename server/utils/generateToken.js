const jwt = require('jsonwebtoken');

/**
 * Generate JWT token and set it as an HTTP-only cookie
 *
 * Why HTTP-only cookies?
 * - JavaScript cannot access them (protects against XSS)
 * - Automatically sent with every request (no manual header management)
 * - Safer than storing tokens in localStorage/sessionStorage
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,                                    // Can't be accessed by JS
    secure: process.env.NODE_ENV === 'production',     // HTTPS only in production
    sameSite: 'lax',                                   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days in ms
  });

  return token;
};

module.exports = { generateTokenAndSetCookie };
