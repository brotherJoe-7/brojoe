# BroJoe Platform — Deployment Guide

## 🌐 Environment Variables

Create `.env.local` with these values:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/brojoe-platform
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
OPENAI_API_KEY=sk-...
```

## 🚀 Vercel Deployment (Frontend)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add all env vars in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

## 🔧 Render Deployment (Backend API)

The Next.js API routes can run on Render as a Node.js service:

1. Connect your GitHub repo on [render.com](https://render.com)
2. Set Build Command: `npm install && npm run build`
3. Set Start Command: `npm start`
4. Add all environment variables
5. Deploy!

## 🍃 MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user with read/write access
3. Whitelist `0.0.0.0/0` (allow all IPs) for Render/Vercel
4. Copy the connection string into `MONGODB_URI`

## 🤖 OpenAI Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add it as `OPENAI_API_KEY` in your environment
3. The platform uses `gpt-4o-mini` for cost efficiency

## 📱 Features Summary

| Module | Description |
|--------|-------------|
| 💰 Expenses | Multi-category logging, personal/mentor funds, totals |
| ✅ Tasks | Kanban board with sub-tasks, priority, deadlines |
| 🤖 AI Reports | GPT-4o-mini chat, daily/weekly reports, PDF export |
| 👤 Portfolio | Achievement system, spending charts, history |
| 🔒 Privacy | GDPR consent, JWT auth, encrypted storage |
| 📤 Sharing | WhatsApp export, PDF download, shareable links |
