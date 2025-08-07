# 使用官方Node.js镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装生产依赖
RUN npm install --production --registry=https://registry.npmmirror.com

# 复制应用代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 80

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/health', (res) => { \
    if (res.statusCode === 200) { \
      process.exit(0); \
    } else { \
      process.exit(1); \
    } \
  }).on('error', () => process.exit(1))"

# 启动应用
CMD ["npm", "start"]
