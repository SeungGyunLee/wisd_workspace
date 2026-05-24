require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const authDb = require('./config/db');
const authRouter = require('./routes/auth');
const { authMiddleware } = require('./middleware/auth');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://152.67.199.142:5173"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
const port = process.env.PORT || 3000;
app.use(express.json()); 
app.use('/api/auth', authRouter);
app.use('/uploads', express.static('uploads'));

// --- 기존 app 코드를 http 서버로 감싸줍니다 (추가) ---
const server = http.createServer(app);

// --- 웹소켓 서버(io) 세팅 (추가) ---
// 프론트엔드 포트(5173)에서 오는 실시간 연결을 허락해 줍니다.
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://152.67.199.142:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// 웹소켓 연결 감지 코드 (누군가 접속하면 실행됨)
io.on('connection', (socket) => {
    console.log(`🟢 새 팀원이 실시간 서버에 접속했습니다! (ID: ${socket.id})`);

    // 접속이 끊겼을 때 감지
    socket.on('disconnect', () => {
        console.log(`🔴 팀원의 접속이 끊어졌습니다. (ID: ${socket.id})`);
    });
});

const db = mysql.createConnection({
    host: process.env.LOCAL_DB_HOST,
    port: process.env.LOCAL_DB_PORT,
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
    database: process.env.LOCAL_DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err.message);
        return;
    }
    console.log('MySQL 데이터베이스 연결 성공');
});

// =====================================
// 프로젝트 CRUD API 시작
// =====================================

// 1. 프로젝트 생성 API (소유자 저장 및 멤버 자동 등록 완료)
app.post('/api/projects', authMiddleware, (req, res) => {
    const { name, description } = req.body;
    const ownerId = req.userId;

    // projects 테이블에 생성한 사람의 id(owner_id)를 함께 저장합니다.
    const query = 'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)';
    db.query(query, [name, description || '', ownerId], (err, result) => {
        if (err) return res.status(500).json({ error: '프로젝트 생성 실패' });
        const projectId = result.insertId;

        //프로젝트를 만든 방장(소유자)도 project_members 테이블에 팀원으로 자동 등록해 줍니다.
        const memberQuery = 'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)';
        db.query(memberQuery, [projectId, ownerId], (memberErr) => {
            if (memberErr) return res.status(500).json({ error: '프로젝트 멤버 등록 실패' });
            
            res.status(201).json({ message: '프로젝트 생성 성공!', id: projectId });
        });
    });
});

// 2. 프로젝트 목록 조회 API (토큰 기반 본인 프로젝트만 필터링 완료)
app.get('/api/projects', authMiddleware, (req, res) => {
    const userId = req.userId;

    //내가 방장이거나(owner_id), project_members 테이블에 팀원으로 들어가 있는 프로젝트만 골라서 가져옵니다.
    const query = `
        SELECT DISTINCT p.* FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.owner_id = ? OR pm.user_id = ?
        ORDER BY p.created_at DESC
    `;

    db.query(query, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: '프로젝트 조회 실패' });
        res.status(200).json(results); // 나에게 권한이 있는 프로젝트 목록만 프론트엔드에 전달!
    });
});

// 3. 카테고리 이름 일괄 수정 API (Update - PUT)
app.put('/api/projects/:projectId/categories', (req, res) => {
    const projectId = req.params.projectId;
    const { oldName, newName } = req.body;
    
    // 이 프로젝트(projectId)에서 예전 카테고리 이름(oldName)을 가진 모든 할 일을 새 이름(newName)으로 바꿔라!
    const query = 'UPDATE tasks SET category = ? WHERE project_id = ? AND category = ?';
    
    db.query(query, [newName, projectId, oldName], (err, result) => {
        if (err) return res.status(500).json({ error: '카테고리 수정 실패' });
        
        io.emit('task_updated'); // 다 바꿨으면 프론트엔드 화면 새로고침 알림!
        res.status(200).json({ message: '카테고리 수정 성공!' });
    });
});

// 4. 프로젝트 수정 API (Update - PUT)
app.put('/api/projects/:id', (req, res) => {
    const projectId = req.params.id; 
    const { name, description } = req.body;
    const query = 'UPDATE projects SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, projectId], (err, result) => {
        if (err) return res.status(500).json({ error: '프로젝트 수정 실패' });
        res.status(200).json({ message: '프로젝트 수정 성공!' });
    });
});

// 5. 프로젝트 삭제 API (Delete - DELETE)
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;

    // 1단계: 프로젝트 지우기 전에 안에 있는 할 일(tasks)부터 싹 비워줌
    db.query('DELETE FROM tasks WHERE project_id = ?', [projectId], (err, result) => {
        if (err) return res.status(500).json({ error: '관련 할 일 삭제 실패' });
        
        // 2단계: 할 일이 다 지워졌으니 프로젝트 본체 삭제!
        db.query('DELETE FROM projects WHERE id = ?', [projectId], (err, result) => {
            if (err) return res.status(500).json({ error: '프로젝트 삭제 실패' });
            
            io.emit('task_updated'); 
            res.status(200).json({ message: '프로젝트 영구 삭제 성공!' });
        });
    });
});

// =====================================
// 할 일(Task) CRUD API 시작
// =====================================

// 6. 할 일 생성 API (Create - POST)
app.post('/api/tasks', (req, res) => {
    const { project_id, category, title, start_date, end_date } = req.body; 
    const query = 'INSERT INTO tasks (project_id, category, title, start_date, end_date) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [project_id, category, title, start_date, end_date], (err, result) => {
        if (err) {
            console.error('할일 DB 저장 에러:', err); // 에러의 진짜 원인을 터미널에 띄워줍니다
            return res.status(500).json({ error: '할 일 생성에 실패했습니다.' });
        }
        io.emit('task_updated');
        res.status(201).json({ message: '할 일 등록 성공!', taskId: result.insertId });
    });
});

// 7. 할 일 목록 조회 API (Read - GET)
app.get('/api/projects/:projectId/tasks', (req, res) => {
    const projectId = req.params.projectId;
    const query = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY start_date ASC';
    
    db.query(query, [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: '할 일 목록 조회 실패' });

        const categoryMap = {};
        results.forEach(task => {
            const catName = task.category || '미분류';
            if (!categoryMap[catName]) {
                categoryMap[catName] = { id: `c_${catName}`, name: catName, tasks: [] };
            }
            categoryMap[catName].tasks.push({
                id: task.id,
                title: task.title,
                done: task.status === 'DONE',
                dueDate: task.end_date,
                pinned: false
            });
        });
        res.status(200).json(Object.values(categoryMap));
    });
});

// 8. 할 일 수정 API (Update - PUT)
app.put('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const { category, title, status, start_date, end_date } = req.body;
    const query = 'UPDATE tasks SET category = ?, title = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?';
    
    db.query(query, [category, title, status, start_date, end_date, taskId], (err, result) => {
        if (err) return res.status(500).json({ error: '할 일 수정 실패' });
        io.emit('task_updated');
        res.status(200).json({ message: '할 일 수정 성공!' });
    });
});

// 9. 할 일 삭제 API (Delete - DELETE)
app.delete('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const query = 'DELETE FROM tasks WHERE id = ?';
    
    db.query(query, [taskId], (err, result) => {
        if (err) return res.status(500).json({ error: '할 일 삭제 실패' });
        io.emit('task_updated');
        res.status(200).json({ message: '할 일 삭제 성공!' });
    });
});

// 기본 서버 구동 확인용
app.get('/', (req, res) => {
    res.send('협업 워크스페이스 백엔드 서버 구동 확인');
});

server.listen(3000, '0.0.0.0', () => {
    console.log('서버가 3000번 포트에서 실행 중입니다.');
});

// =====================================
// 팀 관리 API 시작
// =====================================

// 1. 팀원 초대 API (이메일/아이디로 초대)
app.post('/api/projects/:id/members', authMiddleware, (req, res) => {
    const projectId = req.params.id;
    const { inviteId } = req.body;

    if (!inviteId) return res.status(400).json({ error: '초대할 아이디를 입력해주세요.' });

    // 🔴 1. TiDB(authDb)에서 유저 검색
    authDb.query('SELECT id, display_name FROM users WHERE email = ?', [inviteId], (err, users) => {
        if (err) return res.status(500).json({ error: '서버 에러가 발생했습니다.' });
        if (users.length === 0) return res.status(404).json({ error: '존재하지 않는 아이디입니다.' });

        const targetUser = users[0];

        // 🔴 2. 로컬 DB(db)에서 프로젝트 멤버 중복 확인
        db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUser.id], (err, members) => {
            if (err) return res.status(500).json({ error: '서버 에러가 발생했습니다.' });
            if (members.length > 0) return res.status(400).json({ error: '이미 팀원으로 등록되어 있습니다.' });

            // 🔴 3. 로컬 DB(db)에 멤버 추가
            db.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, targetUser.id], (err) => {
                if (err) return res.status(500).json({ error: '팀원 추가에 실패했습니다.' });
                
                res.status(200).json({
                    message: `${targetUser.display_name}님을 초대했습니다!`,
                    user: { id: targetUser.id, name: targetUser.display_name }
                });
            });
        });
    });
});

// 2. 팀원 내보내기 API
app.delete('/api/projects/:id/members/:userId', authMiddleware, (req, res) => {
    const projectId = req.params.id;
    const targetUserId = req.params.userId;
    const currentUserId = req.userId; // 현재 로그인한 유저

    // 프로젝트 소유자 확인
    db.query('SELECT owner_id FROM projects WHERE id = ?', [projectId], (err, projects) => {
        if (err || projects.length === 0) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
        
        const ownerId = projects[0].owner_id;

        // 예외 1: 소유자를 내보내려 할 때
        if (targetUserId === ownerId) {
            return res.status(400).json({ error: '프로젝트 소유자는 내보낼 수 없습니다.' });
        }

        // 예외 2: 권한 확인 (자신이 스스로 나가거나, 소유자가 남을 내보내는 경우만 허용)
        if (currentUserId !== ownerId && currentUserId !== targetUserId) {
            return res.status(403).json({ error: '팀원을 내보낼 권한이 없습니다.' });
        }

        db.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUserId], (err) => {
            if (err) return res.status(500).json({ error: '팀원 내보내기에 실패했습니다.' });
            res.status(200).json({ message: '팀원이 성공적으로 제외되었습니다.' });
        });
    });
});
// 3. 팀원 목록 조회 API (GET)
app.get('/api/projects/:id/members', authMiddleware, (req, res) => {
    const projectId = req.params.id;

    // 로컬 DB에서 멤버 확인
    db.query('SELECT user_id, joined_at FROM project_members WHERE project_id = ?', [projectId], (err, members) => {
        if (err) return res.status(500).json({ error: '멤버 조회 실패' });
        if (members.length === 0) return res.status(200).json([]);

        const userIds = members.map(m => m.user_id);
        const placeholders = userIds.map(() => '?').join(',');
        
        // TiDB에서 유저 상세 정보 가져오기
        authDb.query(`SELECT id, email as loginId, display_name as name FROM users WHERE id IN (${placeholders})`, userIds, (err, users) => {
            if (err) return res.status(500).json({ error: '유저 정보 조회 실패' });

            const result = users.map(user => {
                const memberInfo = members.find(m => m.user_id === user.id);
                return { ...user, joined_at: memberInfo.joined_at };
            });

            res.status(200).json(result);
        });
    });
});

// =====================================
// 게시판(중간 공유) & 파일 업로드 API 시작
// =====================================

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
app.post('/api/projects/:projectId/posts', authMiddleware, upload.array('files'), (req, res) => {
    const { projectId } = req.params;
    const { content, categoryTag } = req.body;
    const authorId = req.userId;

    const postQuery = 'INSERT INTO posts (project_id, author_id, content, category_tag) VALUES (?, ?, ?, ?)';
    db.query(postQuery, [projectId, authorId, content, categoryTag || null], (err, result) => {
        if (err) return res.status(500).json({ error: '게시물 작성 실패' });
        const postId = result.insertId;

        if (!req.files || req.files.length === 0) {
            return res.status(201).json({ message: '게시 성공', postId });
        }

        const fileValues = req.files.map(f => [
            postId, f.originalname, f.mimetype, f.size, 
            `/uploads/${f.filename}`, f.mimetype.startsWith('image/')
        ]);

        const fileQuery = 'INSERT INTO post_files (post_id, file_name, file_type, file_size, file_url, is_image) VALUES ?';
        db.query(fileQuery, [fileValues], (err) => {
            if (err) return res.status(500).json({ error: '파일 정보 저장 실패' });
            res.status(201).json({ message: '게시 및 파일 업로드 성공', postId });
        });
    });
});

// 2. 프로젝트의 모든 게시물 조회
app.get('/api/projects/:projectId/posts', authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    try {
        const posts = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM posts WHERE project_id = ? ORDER BY created_at DESC', [projectId], (err, results) => err ? reject(err) : resolve(results));
        });

        const fullPosts = await Promise.all(posts.map(async (post) => {
            const images = await new Promise(resolve => db.query('SELECT id, file_name as name, file_size as size, file_type as type, file_url as src, is_image as isImg FROM post_files WHERE post_id = ?', [post.id], (err, res) => resolve(res || [])));
            const likes = await new Promise(resolve => db.query('SELECT user_id FROM post_likes WHERE post_id = ?', [post.id], (err, res) => resolve((res || []).map(l => l.user_id))));
            const comments = await new Promise(resolve => db.query('SELECT id, author_id as authorId, content, created_at as timestamp FROM post_comments WHERE post_id = ? ORDER BY created_at ASC', [post.id], (err, res) => resolve(res || [])));

            return {
                id: post.id, authorId: post.author_id, content: post.content,
                categoryTag: post.category_tag, timestamp: post.created_at,
                images, likes, comments 
            };
        }));
        res.json(fullPosts);
    } catch (error) {
        res.status(500).json({ error: '게시물을 불러오지 못했습니다.' });
    }
});

// 3. 좋아요 토글
app.post('/api/posts/:postId/like', authMiddleware, (req, res) => {
    const { postId } = req.params;
    const userId = req.userId;

    db.query('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB 에러' });
        if (results.length > 0) {
            db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], () => res.json({ liked: false }));
        } else {
            db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], () => res.json({ liked: true }));
        }
    });
});

// 4. 댓글 달기
app.post('/api/posts/:postId/comments', authMiddleware, (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.userId;

    db.query('INSERT INTO post_comments (post_id, author_id, content) VALUES (?, ?, ?)', [postId, authorId, content], (err, result) => {
        if (err) return res.status(500).json({ error: '댓글 작성 실패' });
        res.status(201).json({ id: result.insertId, authorId, content, timestamp: new Date() });
    });
});