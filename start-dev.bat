@echo off
echo Starting Vue Big Screen Development Server...
echo.

REM 设置环境变量
set NODE_ENV=development
set VUE_APP_BASE_URL=http://localhost:8080

REM 清理缓存
echo Cleaning cache...
npm cache clean --force

REM 安装依赖（如果需要）
echo Installing dependencies...
npm install

REM 启动开发服务器
echo Starting development server...
echo.
echo Server will be available at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.

npm run serve

pause
