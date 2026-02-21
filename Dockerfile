FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build
RUN npm prune --production

ENV TZ=Asia/Tokyo
ENV NODE_ENV=production

# 内部cronスケジューラで起動
CMD ["node", "dist/index.js"]
