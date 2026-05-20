require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // 공통 DB 설정 사용

const http = require('http'); 
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;
const FRONTEND_URL = "http://152.67.199.142:5173";

// 라우터 임포트
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
// --- 기존 app 코드를 http 서버로 감싸줍니다 ---
const server = http.createServer(app);

// --- 웹소켓 서버(io) 세팅 ---
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL, 
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true 
    }
});

io.on('connection', (socket) => {
    console.log(`🟢 새 팀원이 실시간 서버에 접속했습니다! (ID: ${socket.id})`);
    socket.on('disconnect', () => {
        console.log(`🔴 팀원의 접속이 끊어졌습니다. (ID: ${socket.id})`);
    });
});

app.use(cors({
    origin: FRONTEND_URL,                               
    methods: ['GET', 'POST', 'PUT', 'DELETE'],          
    allowedHeaders: ['Content-Type', 'Authorization'],  
    credentials: true                                   
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);

// =====================================
// 프로젝트 CRUD API 시작
// =====================================

app.post('/api/projects', (req, res) => {
    const { name, description } = req.body; 
    const query = 'INSERT INTO projects (name, description) VALUES (?, ?)';
    db.query(query, [name, description], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 생성에 실패했습니다.' });
        }
        res.status(201).json({ 
            message: '프로젝트가 성공적으로 생성되었습니다!',
            projectId: result.insertId 
        });
    });
});

app.get('/api/projects', (req, res) => {
    const query = 'SELECT * FROM projects ORDER BY created_at DESC'; 
    db.query(query, (err, results) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 목록 조회에 실패했습니다.' });
        }
        res.status(200).json(results);
    });
});

app.put('/api/projects/:id', (req, res) => {
    const projectId = req.params.id; 
    const { name, description } = req.body;
    const query = 'UPDATE projects SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, projectId], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 수정에 실패했습니다.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 ID의 프로젝트를 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '프로젝트가 성공적으로 수정되었습니다!' });
    });
});

app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const query = 'DELETE FROM projects WHERE id = ?';
    db.query(query, [projectId], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 삭제에 실패했습니다.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 ID의 프로젝트를 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '프로젝트가 성공적으로 삭제되었습니다!' });
    });
});

// =====================================
// 할 일(Task) CRUD API 시작
// =====================================

app.post('/api/tasks', (req, res) => {
    const { project_id, category, title, start_date, end_date } = req.body; 
    const query = `
        INSERT INTO tasks (project_id, category, title, start_date, end_date) 
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [project_id, category, title, start_date, end_date], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '할 일 생성에 실패했습니다.' });
        }
        io.emit('task_updated');
        res.status(201).json({ 
            message: '할 일이 성공적으로 등록되었습니다!',
            taskId: result.insertId 
        });
    });
});

app.get('/api/projects/:projectId/tasks', (req, res) => {
    const projectId = req.params.projectId;
    const query = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY start_date ASC';
    db.query(query, [projectId], (err, results) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '할 일 목록을 불러오는데 실패했습니다.' });
        }
        res.status(200).json(results);
    });
});

app.put('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const { category, title, status, start_date, end_date } = req.body;
    const query = `
        UPDATE tasks 
        SET category = ?, title = ?, status = ?, start_date = ?, end_date = ?
        WHERE id = ?
    `;
    db.query(query, [category, title, status, start_date, end_date, taskId], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '할 일 수정에 실패했습니다.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 ID의 할 일을 찾을 수 없습니다.' });
        }
        io.emit('task_updated');
        res.status(200).json({ message: '할 일이 성공적으로 수정되었습니다!' });
    });
});

app.delete('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [taskId], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '할 일 삭제에 실패했습니다.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 ID의 할 일을 찾을 수 없습니다.' });
        }
        io.emit('task_updated');
        res.status(200).json({ message: '할 일이 성공적으로 삭제되었습니다!' });
    });
});

app.get('/', (req, res) => {
    res.send('협업 워크스페이스 백엔드 서버 구동 확인');
});

server.listen(port, () => {
    console.log(`🚀 서버가 포트 ${port}에서 실행 중입니다! (실시간 웹소켓 포함)`);
});
