# 1. 어떤 환경에서 시작할지
FROM node:18
# 2. 서버 안의 작업 공간 만들기
WORKDIR /usr/src/app
# 3. 라이브러리 목록 복사 및 설치
COPY package*.json ./
RUN npm install
# 4. 소스 코드 전체 복사
COPY . .
# 5. 실행할 명령어
CMD ["npm", "start"]