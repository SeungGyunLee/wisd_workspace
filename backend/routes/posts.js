const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 업로드 폴더 자동 생성
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer 설정 (디스크 저장소)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 1. 게시물 작성 및 파일 업로드
router.post('/projects/:projectId/posts', authMiddleware, upload.array('files'), (req, res) => {
    const { projectId } = req.params;
    const { content, categoryTag } = req.body;
    const authorId = req.userId;

    // 글 등록
    const postQuery = 'INSERT INTO posts (project_id, author_id, content, category_tag) VALUES (?, ?, ?, ?)';
    db.query(postQuery, [projectId, authorId, content, categoryTag || null], (err, result) => {
        if (err) return res.status(500).json({ error: '게시물 작성 실패' });
        
        const postId = result.insertId;

        // 첨부파일이 없다면 바로 리턴
        if (!req.files || req.files.length === 0) {
            return res.status(201).json({ message: '게시 성공', postId });
        }

        // 첨부파일이 있다면 DB에 다중 등록
        const fileValues = req.files.map(f => [
            postId, 
            f.originalname, 
            f.mimetype, 
            f.size, 
            `/uploads/${f.filename}`, // 클라이언트가 접근할 URL
            f.mimetype.startsWith('image/')
        ]);

        const fileQuery = 'INSERT INTO post_files (post_id, file_name, file_type, file_size, file_url, is_image) VALUES ?';
        db.query(fileQuery, [fileValues], (err) => {
            if (err) return res.status(500).json({ error: '파일 정보 저장 실패' });
            res.status(201).json({ message: '게시 및 파일 업로드 성공', postId });
        });
    });
});

// 2. 프로젝트의 모든 게시물 조회
router.get('/projects/:projectId/posts', authMiddleware, async (req, res) => {
    const { projectId } = req.params;

    try {
        // 1. 게시물 기본 정보 가져오기
        const posts = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM posts WHERE project_id = ? ORDER BY created_at DESC', [projectId], (err, results) => err ? reject(err) : resolve(results));
        });

        // 2. 각 게시물마다 파일, 좋아요, 댓글 조회해서 합치기
        const fullPosts = await Promise.all(posts.map(async (post) => {
            const images = await new Promise((resolve) => {
                db.query('SELECT id, file_name as name, file_size as size, file_type as type, file_url as src, is_image as isImg FROM post_files WHERE post_id = ?', [post.id], (err, res) => resolve(res || []));
            });
            const likes = await new Promise((resolve) => {
                db.query('SELECT user_id FROM post_likes WHERE post_id = ?', [post.id], (err, res) => resolve((res || []).map(l => l.user_id)));
            });
            const comments = await new Promise((resolve) => {
                db.query('SELECT id, author_id as authorId, content, created_at as timestamp FROM post_comments WHERE post_id = ? ORDER BY created_at ASC', [post.id], (err, res) => resolve(res || []));
            });

            return {
                id: post.id,
                authorId: post.author_id,
                content: post.content,
                categoryTag: post.category_tag,
                timestamp: post.created_at,
                images,  
                likes,   
                comments 
            };
        }));

        res.json(fullPosts);
    } catch (error) {
        res.status(500).json({ error: '게시물을 불러오지 못했습니다.' });
    }
});

// 3. 좋아요 토글
router.post('/posts/:postId/like', authMiddleware, (req, res) => {
    const { postId } = req.params;
    const userId = req.userId;

    db.query('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB 에러' });

        if (results.length > 0) {
            // 이미 좋아요 한 상태면 취소
            db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], () => res.json({ liked: false }));
        } else {
            // 안 한 상태면 추가
            db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], () => res.json({ liked: true }));
        }
    });
});

// 4. 댓글 달기
router.post('/posts/:postId/comments', authMiddleware, (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.userId;

    db.query('INSERT INTO post_comments (post_id, author_id, content) VALUES (?, ?, ?)', [postId, authorId, content], (err, result) => {
        if (err) return res.status(500).json({ error: '댓글 작성 실패' });
        res.status(201).json({ id: result.insertId, authorId, content, timestamp: new Date() });
    });
});

module.exports = router;