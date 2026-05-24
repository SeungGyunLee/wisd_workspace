-- 1. 프로젝트 테이블 생성
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id VARCHAR(36) -- 프로젝트 소유자 컬럼 (테이블 생성 시점에 아예 포함)
);

-- 2. 할 일(Task) 테이블 생성 
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

-- 3. 게시글 테이블
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    content TEXT,
    category_tag INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    -- ❌ FOREIGN KEY (author_id) REFERENCES users(id) 삭제됨
);

-- 4. 첨부 파일/이미지 테이블 (이건 그대로 사용)
CREATE TABLE post_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    file_url VARCHAR(500) NOT NULL,
    is_image BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 5. 좋아요 테이블
CREATE TABLE post_likes (
    post_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    -- ❌ FOREIGN KEY (user_id) REFERENCES users(id) 삭제됨
);

-- 6. 댓글 테이블
CREATE TABLE post_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    -- ❌ FOREIGN KEY (author_id) REFERENCES users(id) 삭제됨
);

-- 7. 프로젝트 멤버 관리 테이블
CREATE TABLE project_members (
    project_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    -- ❌ FOREIGN KEY (user_id) REFERENCES users(id) 삭제됨
);