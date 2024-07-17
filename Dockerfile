# 设置基础镜像
FROM node:latest

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制其他文件
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "run", "start"]
