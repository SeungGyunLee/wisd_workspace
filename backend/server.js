require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // 중요: 클라이언트가 보내는 JSON 데이터를 읽기 위해 필요

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
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
    
    // 데이터베이스에 프로젝트를 추가하는 SQL 명령어
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

// 2. 프로젝트 목록 조회 API (Read - GET)
app.get('/api/projects', (req, res) => {
    // 저장된 프로젝트들을 최신순으로 가져오는 SQL 명령어
    const query = 'SELECT * FROM projects ORDER BY created_at DESC'; 
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 목록 조회에 실패했습니다.' });
        }
        res.status(200).json(results);
    });
});

// 3. 프로젝트 수정 API (Update - PUT)
app.put('/api/projects/:id', (req, res) => {
    // URL에서 프로젝트 ID(몇 번을 수정할지)를 가져옵니다.
    const projectId = req.params.id; 
    const { name, description } = req.body; // 수정할 새로운 내용

    const query = 'UPDATE projects SET name = ?, description = ? WHERE id = ?';
    
    db.query(query, [name, description, projectId], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 수정에 실패했습니다.' });
        }
        // 수정할 데이터가 없을 경우(잘못된 ID)
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 ID의 프로젝트를 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '프로젝트가 성공적으로 수정되었습니다!' });
    });
});

// 4. 프로젝트 삭제 API (Delete - DELETE)
app.delete('/api/projects/:id', (req, res) => {
    // URL에서 프로젝트 ID(몇 번을 삭제할지)를 가져옵니다.
    const projectId = req.params.id;

    const query = 'DELETE FROM projects WHERE id = ?';
    
    db.query(query, [projectId], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '프로젝트 삭제에 실패했습니다.' });
        }
        // 삭제할 데이터가 없을 경우(잘못된 ID)
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 ID의 프로젝트를 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '프로젝트가 성공적으로 삭제되었습니다!' });
    });
});

// =====================================
// 할 일(Task) CRUD API 시작
// =====================================

// 5. 할 일 생성 API (Create - POST)
app.post('/api/tasks', (req, res) => {
    // 프론트엔드(클라이언트)에서 보내주는 데이터들
    const { project_id, category, title, start_date, end_date } = req.body; 
    
    // 데이터베이스에 할 일을 추가하는 SQL 명령어
    const query = `
        INSERT INTO tasks (project_id, category, title, start_date, end_date) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(query, [project_id, category, title, start_date, end_date], (err, result) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '할 일 생성에 실패했습니다.' });
        }
        res.status(201).json({ 
            message: '할 일이 성공적으로 등록되었습니다!',
            taskId: result.insertId 
        });
    });
});

// 6. 특정 프로젝트의 할 일 목록 조회 API (Read - GET)
app.get('/api/projects/:projectId/tasks', (req, res) => {
    // URL에서 프로젝트 ID를 가져옵니다. (예: /api/projects/1/tasks 이면 1을 가져옴)
    const projectId = req.params.projectId;

    // 해당 프로젝트의 할 일들을 시작 날짜(start_date) 순서대로 정렬해서 가져오는 쿼리
    const query = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY start_date ASC';
    
    db.query(query, [projectId], (err, results) => {
        if (err) {
            console.error('에러 발생:', err);
            return res.status(500).json({ error: '할 일 목록을 불러오는데 실패했습니다.' });
        }
        res.status(200).json(results);
    });
});

// 7. 할 일 수정 API (Update - PUT)
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
        res.status(200).json({ message: '할 일이 성공적으로 수정되었습니다!' });
    });
});

// 8. 할 일 삭제 API (Delete - DELETE)
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
        res.status(200).json({ message: '할 일이 성공적으로 삭제되었습니다!' });
    });
});

// 기본 서버 구동 확인용
app.get('/', (req, res) => {
    res.send('협업 워크스페이스 백엔드 서버 구동 확인');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});