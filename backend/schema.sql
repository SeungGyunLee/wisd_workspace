-- 1. 프로젝트 테이블 생성
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 할 일(Task) 테이블 생성 (기획안 반영 버전)
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    category VARCHAR(100),            
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'TODO', 
    start_date DATE,                  
    end_date DATE,                    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);