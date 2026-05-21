const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
    /*ssl: {
        rejectUnauthorized: true
    }*/
});

db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err.message);
        return;
    }
    console.log('MySQL 데이터베이스 연결 성공 (config/db.js)');
});

module.exports = db;
