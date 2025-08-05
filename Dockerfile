FROM node:16-alpine

WORKDIR /app

# 复制package.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制代码
COPY . .

# 暴露8080端口
EXPOSE 8080

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 启动应用
CMD ["npm", "start"]
