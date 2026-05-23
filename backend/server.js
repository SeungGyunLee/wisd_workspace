require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const authRouter = require('./routes/auth');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://152.67.199.142:5173"]
}));
app.use(express.json()); // 중요: 클라이언트가 보내는 JSON 데이터를 읽기 위해 필요
const port = process.env.PORT || 3000;
app.use('/api/auth', authRouter);

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

// 1. 프로젝트 생성 API (Create - POST)
app.post('/api/projects', (req, res) => {
    const { name, description } = req.body;
    const query = 'INSERT INTO projects (name, description) VALUES (?, ?)';
    db.query(query, [name, description || ''], (err, result) => {
        if (err) return res.status(500).json({ error: '프로젝트 생성 실패' });
        res.status(201).json({ message: '프로젝트 생성 성공!', id: result.insertId });
    });
});

// 2. 프로젝트 목록 조회 API (Read - GET)
app.get('/api/projects', (req, res) => {
    const query = 'SELECT * FROM projects';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: '프로젝트 조회 실패' });
        res.status(200).json(results);
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
app.delete('/api/projects/:projectId/categories', (req, res) => {
    const projectId = req.params.projectId;
    const { categoryName } = req.body;
    
    // 이 프로젝트(projectId)에서 해당 카테고리 이름(categoryName)을 가진 모든 할 일을 싹 다 지워라!
    const query = 'DELETE FROM tasks WHERE project_id = ? AND category = ?';
    
    db.query(query, [projectId, categoryName], (err, result) => {
        if (err) return res.status(500).json({ error: '카테고리 삭제 실패' });
        
        io.emit('task_updated'); // 다 지웠으면 프론트엔드 화면 새로고침 알림!
        res.status(200).json({ message: '카테고리 삭제 성공!' });
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