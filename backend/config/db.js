const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_NAME,
    ssl: {
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, conn) => {
    if (err) {
        console.error('MySQL 연결 오류:', err.message);
        return;
    }
    console.log('MySQL 데이터베이스 Pool 연결 성공');
    conn.release();
});

module.exports = db;
