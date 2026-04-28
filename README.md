# NavLink

NavLink 是一个自托管的多模块导航与运维平台，当前包含导航首页、订阅管理、Docker 管理、VPS/SSH 工作台与实时监控等能力。前端基于 React + Vite，后端基于 Express + Socket.IO，运行数据默认落在本地 `data/` 目录，数据库为 SQLite。

## 1. 源码运行

### 1.1 环境要求

- Node.js 20+
- npm 10+
- Linux / macOS / WSL2 均可
- 如需使用 Docker 管理功能，宿主机需要可访问 Docker Engine

### 1.2 安装依赖

```bash
npm install
```

### 1.3 开发模式

开发模式会同时启动前端 Vite 开发服务器和后端 Node 服务：

```bash
npm run dev:all
```

默认访问地址：

- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:3001`

### 1.4 源码生产运行

先构建前端静态资源，再启动 Node 服务：

```bash
npm run build
export PORT=3001
export NODE_ENV=production
export JWT_SECRET='<replace-with-a-random-secret>'
export ADMIN_PASSWORD='<set-your-admin-password>'
npm run start
```

生产模式下：

- Web 入口默认是 `http://localhost:3001`
- 首次登录使用你设置的 `ADMIN_PASSWORD`
- 如果未设置 `DB_PATH`，SQLite 数据库默认写入 `data/navlink.db`

### 1.5 常用环境变量

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `3001` |
| `NODE_ENV` | 运行环境 | 未设置 |
| `JWT_SECRET` | JWT 签名密钥，生产环境必须自定义 | `your-secret-key-change-this-in-prod` |
| `ADMIN_PASSWORD` | 管理员初始密码，建议自行设置 | `admin` |
| `DB_PATH` | SQLite 数据库文件路径 | `data/navlink.db` |

### 1.6 数据目录

运行期数据默认位于 `data/`：

```text
data/
├── navlink.db
└── uploads/
```

建议：

- 不要把 `data/` 中的数据库、上传文件、证书、私钥提交到仓库
- 生产环境请始终通过环境变量传入自己的密钥和管理员密码

## 2. Docker 镜像的编译与构建

### 2.1 构建镜像

项目已自带多阶段 `Dockerfile`，默认使用公开基础镜像 `node:20-alpine`：

```bash
docker build -t navlink-local:latest .
```

如需覆盖基础镜像，可通过通用构建参数指定：

```bash
docker build --build-arg NODE_IMAGE=node:20-alpine -t navlink-local:latest .
```

### 2.2 启动容器

```bash
mkdir -p ./data

docker run -d \
  --name navlink-local \
  -p 8088:80 \
  -v "$(pwd)"/data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e PORT=80 \
  -e NODE_ENV=production \
  -e JWT_SECRET='<replace-with-a-random-secret>' \
  -e ADMIN_PASSWORD='<set-your-admin-password>' \
  --restart always \
  navlink-local:latest
```

启动后访问：

- `http://localhost:8088`

说明：

- `./data:/app/data` 用于持久化数据库与上传文件
- `/var/run/docker.sock:/var/run/docker.sock` 用于启用本机 Docker 管理能力
- 如果你只管理远程 Docker 主机，可以按需移除 `docker.sock` 挂载

### 2.3 使用 docker compose

仓库内提供了 `docker-compose.yml`。如果你希望直接通过源码构建并启动，可以将服务切换为 `build: .`：

```yaml
services:
  navlink:
    build: .
    container_name: navlink
    ports:
      - "8088:80"
    volumes:
      - ./data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - PORT=80
      - NODE_ENV=production
      - JWT_SECRET=<replace-with-a-random-secret>
      - ADMIN_PASSWORD=<set-your-admin-password>
    restart: always
```

然后执行：

```bash
docker compose up -d --build
```

### 2.4 升级镜像

当源码有更新时，重新构建并重启容器即可：

```bash
docker build -t navlink-local:latest .
docker rm -f navlink-local
docker run -d \
  --name navlink-local \
  -p 8088:80 \
  -v "$(pwd)"/data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e PORT=80 \
  -e NODE_ENV=production \
  -e JWT_SECRET='<replace-with-a-random-secret>' \
  -e ADMIN_PASSWORD='<set-your-admin-password>' \
  --restart always \
  navlink-local:latest
```

## 3. 项目功能介绍

### 3.1 导航首页

- 支持顶部导航、搜索引擎切换、Hero 区、分类分组、推广区与页脚配置
- 内置后台配置面板，可调整主题颜色、导航结构、分类内容、媒体资源与页面文案
- 支持链接健康检查与站内搜索
- 首页右侧保留 GitHub 榜单组件

### 3.2 订阅管理

- 管理订阅项目、到期时间、周期、金额、币种与自动续费状态
- 支持自定义提醒、重复提醒、提醒面板与日历视图
- 支持通知测试与定时检查
- 后端通过定时任务执行订阅检查、提醒检查与历史提醒清理

### 3.3 Docker 管理

- 支持本机、TCP、TLS、SSH 四种 Docker 连接方式
- 支持多服务器管理、默认服务器切换与连接测试
- 支持容器、镜像、网络、卷的常见操作
- 支持系统信息面板、日志查看、容器 Shell 与操作审计日志

### 3.4 VPS / SSH 工作台

- 支持服务器分组、主机信息维护与连通性检测
- 支持 Web SSH 终端、多会话切换、命令片段库与文件管理
- VPS 凭据在后端入库前会做加密处理，前端列表默认不回传明文密码或私钥

### 3.5 独立实时监控板块

- 监控能力已从原 SSH 工作区中拆分为独立板块，原 SSH 功能保持不变
- 每台机器以单独长条展示，监控项在横向区域内均匀分布
- 实时展示 CPU 占用、内存占用、硬盘占用、累计流量、实时下载速度、实时上传速度
- 支持从监控板块直接进入对应服务器的 SSH 会话
- 实时数据通过 Socket.IO + SSH 采集远端 `/proc` 与系统命令输出生成

### 3.6 认证与应用控制

- `Sub`、`Docker`、`VPS` 模块默认要求登录
- 后端提供 JWT 认证接口
- 支持应用启停配置，前端会根据配置决定模块是否可访问

### 3.7 Chrome 扩展

- 仓库内附带 `chrome-extension/`，可作为快速入口使用
- 包含弹窗、配置页与接口访问封装，适合与主站配合部署

## 4. 项目结构介绍

```text
navlinks/
├── src/
│   ├── apps/
│   │   ├── navlink/         # 导航首页与后台配置
│   │   ├── sub/             # 订阅管理
│   │   ├── docker/          # Docker 管理
│   │   └── vps/             # VPS / SSH / 实时监控
│   ├── shared/              # 共享组件、类型、上下文、工具函数
│   ├── index.css            # 全局样式
│   └── index.tsx            # 前端总入口与路由
├── server/
│   ├── config/              # 服务端配置与应用配置读写
│   ├── database/            # SQLite 初始化、Schema、DAO、迁移脚本
│   ├── jobs/                # 定时任务初始化
│   ├── middleware/          # 认证与应用访问控制
│   ├── routes/              # 各模块 API 路由
│   ├── services/            # Docker、通知、订阅、Socket、VPS 等服务
│   └── utils/               # 加密、文件、URL 等通用工具
├── chrome-extension/        # 浏览器扩展
├── data/                    # 运行期数据目录
├── dist/                    # 前端构建产物
├── Dockerfile               # Docker 多阶段构建文件
├── docker-compose.yml       # Docker 编排示例
├── package.json             # 前端与后端脚本、依赖定义
├── server.js                # Express + Socket.IO 启动入口
└── README.md                # 项目说明文档
```

### 4.1 前端模块说明

- `src/apps/navlink`：导航首页、管理后台、右侧榜单组件
- `src/apps/sub`：订阅列表、提醒面板、设置面板、日历视图
- `src/apps/docker`：服务器侧边栏、全局总览、资源列表、日志与容器终端
- `src/apps/vps`：服务器列表、终端、监控板、文件管理、命令片段
- `src/shared`：登录框、弹窗、图标、配置上下文、公共 API 工具

### 4.2 后端模块说明

- `server/routes/navlink.js`：导航配置与站点配置接口
- `server/routes/subscriptions.js`、`server/routes/reminders.js`：订阅与提醒接口
- `server/routes/docker.js`：Docker 主机与资源管理接口
- `server/routes/vps.js`：VPS 分组、主机、片段库接口
- `server/services/socketService.js`：Web SSH 与实时监控 Socket 服务
- `server/database/schema.sql`：SQLite 表结构定义