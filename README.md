# 贪吃蛇 Snake Game

React + TypeScript + Vite + Tailwind CSS 实现的网页贪吃蛇游戏，支持 Supabase 荣誉榜。

## 本地开发

```bash
npm install
npm run dev
```

## Supabase 环境变量

本地创建 `.env.local`：

```env
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```

没有配置 Supabase 环境变量时，游戏本体仍可运行。线上部署可以使用同域名 `/api/scores` 备用排行榜服务，避免 Supabase 不可用时影响荣誉榜。

## Supabase SQL 初始化

打开 Supabase SQL Editor，执行：

```sql
-- supabase/schema.sql
```

也可以直接复制 [supabase/schema.sql](supabase/schema.sql) 中的完整 SQL 执行。该脚本会创建 `public.snake_scores`，开启 RLS，并允许 `anon` 读取和插入成绩。

## Vercel 环境变量

进入：

Project Settings → Environment Variables

添加：

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

修改 Vercel 环境变量后必须重新部署，否则前端包里仍然是旧值。

## 构建

```bash
npm run build
```

## 备用排行榜 API

如果不使用 Supabase，可以在服务器运行：

```bash
node server/scores-server.mjs
```

默认监听 `127.0.0.1:8787`，通过 nginx 将 `/api/` 代理到该服务。成绩数据默认保存到：

```text
/var/www/snake-game-data/scores.json
```

systemd 示例见 [deploy/snake-scores.service](deploy/snake-scores.service)。
