#!/bin/bash

# 更新代码
echo "Updating code from git..."
git pull

# 删除所有的Docker容器
echo "Removing Docker containers..."
docker rm -f nest-excel

# 删除所有的Docker镜像
echo "Removing Docker images..."
docker rmi -f nest-excel:latest

echo "Cleanup completed."

# 构建镜像并启动容器
docker build -t nest-excel:latest .
docker run -d --name nest-excel -p 3000:3000 nest-excel:latest

echo "Build and run completed."