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

没有配置 Supabase 环境变量时，游戏本体仍可运行，荣誉榜会显示“荣誉榜暂不可用：缺少 Supabase 环境变量”。

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
