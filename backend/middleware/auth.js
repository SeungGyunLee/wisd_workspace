const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wisd-workspace-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization 헤더가 필요합니다.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰 형식이 올바르지 않습니다.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.loginId = decoded.loginId;

        next();
    } catch (error) {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = {
    authMiddleware,
    JWT_SECRET
};
