# 1. 빌드 환경 세팅
FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# 2. 리액트 실행 (배포 시에는 나중에 Nginx로 바꿀 수 있습니다)
CMD ["npm", "run", "dev", "--", "--host"]
