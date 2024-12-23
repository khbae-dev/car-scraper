# Puppeteer 기반 Node.js 이미지
FROM node:16-buster

# 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    cron \
    wget \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 프로젝트 파일 복사
COPY package*.json ./
RUN npm install
COPY . .

# 크론 설정 파일 복사
COPY crontab /etc/cron.d/crawler-cron

# 권한 설정
RUN chmod 0644 /etc/cron.d/crawler-cron && \
    crontab /etc/cron.d/crawler-cron

# 로그 파일을 저장할 디렉토리 생성
RUN touch /var/log/crawler.log

# Crontab 실행
CMD ["cron", "-f"]