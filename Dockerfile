FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY package*.json ./

# 安装依赖
RUN npm install --production --registry=https://registry.npmmirror.com

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 80

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

# 启动应用（以root用户运行）
CMD ["npm", "start"]
