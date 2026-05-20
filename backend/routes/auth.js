const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 토큰 생성 함수
function generateToken(userId, loginId) {
    return jwt.sign({ userId, loginId }, JWT_SECRET, { expiresIn: '7d' });
}

// 1. 아이디 중복 확인 API
router.get('/check', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: '아이디를 입력해주세요.' });

    const query = 'SELECT id FROM users WHERE email = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        
        res.json({ taken: results.length > 0 }); 
    });
});

// 2. 회원가입 API
router.post('/signup', async (req, res) => {
    try {
        const { id, name, password } = req.body;

        if (!id || !password || !name) {
            return res.status(400).json({ error: '아이디, 비밀번호, 닉네임은 필수입니다.' });
        }

        const checkQuery = 'SELECT id FROM users WHERE email = ?';
        db.query(checkQuery, [id], async (err, results) => {
            if (err) return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
            if (results.length > 0) {
                return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
            }

            const userId = uuidv4();
            const hashedPassword = await bcrypt.hash(password, 10);

            const insertQuery = 'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [userId, id, hashedPassword, name], (err) => {
                if (err) return res.status(500).json({ error: '회원가입에 실패했습니다.' });

                const token = generateToken(userId, id);
                res.status(201).json({
                    user: { id: userId, loginId: id, name },
                    token: token 
                });
            });
        });
    } catch (err) {
        res.status(500).json({ error: '알 수 없는 오류가 발생했습니다.' });
    }
});

// 3. 로그인 API
router.post('/login', (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [id], async (err, results) => {
        if (err) return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        if (results.length === 0) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const user = results[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const token = generateToken(user.id, user.email);
        res.json({
            user: { id: user.id, loginId: user.email, name: user.display_name },
            token: token 
        });
    });
});

// 4. 내 정보 조회 API
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
    const query = 'SELECT id, email as loginId, display_name as name FROM users WHERE id = ?';
    db.query(query, [req.userId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        res.json(results[0]);
    });
});

module.exports = router;