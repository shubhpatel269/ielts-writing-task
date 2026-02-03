# Deploy Backend to Render (Step-by-Step)

Your **Node/Express backend** (server folder) runs on Render so your Netlify frontend can call the API. Render free tier is enough for this project.

---

## Prerequisites

- Your project is on **GitHub** (see [GITHUB.md](./GITHUB.md) if not).
- You have a GitHub account.

---

## Step 1: Sign up / Log in to Render

1. Go to **[render.com](https://render.com)**.
2. Click **Get Started for Free** (or **Sign In** if you have an account).
3. Sign up with **GitHub** (recommended) so Render can read your repos.
4. Authorize Render when GitHub asks.

---

## Step 2: Create a new Web Service

1. On the Render **Dashboard**, click **New +** (top right).
2. Choose **Web Service**.
3. You’ll see “Connect a repository”. If your repo is not listed:
   - Click **Configure account** and connect your GitHub account, or
   - Click **Connect a repository** and select the GitHub repo that has your project (e.g. `ielts-writing-task`).
4. Select your **repository** (e.g. `YourUsername/ielts-writing-task`) and click **Connect**.

---

## Step 3: Configure the Web Service

Fill in these settings exactly:

| Field | Value |
|-------|--------|
| **Name** | `ielts-writing-task` (or any name, e.g. `ielts-writing-api`) |
| **Region** | Choose one close to you (e.g. Oregon, Frankfurt) |
| **Branch** | `main` (or whatever branch you use) |
| **Root Directory** | **`server`** ← Important: so Render only uses the `server` folder |
| **Runtime** | **Node** |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

---

## Step 4: Plan and Environment

1. **Instance Type:** Leave **Free** (or pick a paid plan if you prefer).
2. **Environment Variables** (optional but good to set):
   - Click **Add Environment Variable**.
   - **Key:** `NODE_VERSION`  
   - **Value:** `18` (or `20` if you use Node 20).

Click **Create Web Service**.

---

## Step 5: Wait for Deploy

1. Render will **clone** your repo, go into the `server` folder, run `npm install`, then `npm start`.
2. Watch the **Logs** on the deploy page. The first deploy can take 1–2 minutes.
3. When it says **Live** (green), the backend is running.
4. Copy your service URL from the top of the page, e.g.:
   - **`https://ielts-writing-task-xxxx.onrender.com`**  
   (no trailing slash)

---

## Step 6: Use This URL in Netlify

1. In **Netlify** (where your frontend is), go to **Site settings** → **Environment variables**.
2. Add or edit:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://ielts-writing-task-xxxx.onrender.com` (your Render URL, no trailing slash).
3. Trigger a **new deploy** (e.g. **Deploys** → **Trigger deploy** → **Deploy site**) so the frontend is built again with this URL.

Your React app will now call the Render backend for submit, view PDF, teacher login, etc.

---

## Summary Checklist

- [ ] Render account created (GitHub login).
- [ ] New **Web Service** → repo connected.
- [ ] **Root Directory** = `server`.
- [ ] **Build Command** = `npm install`.
- [ ] **Start Command** = `npm start`.
- [ ] **Create Web Service** → deploy finishes and status is **Live**.
- [ ] Copy the **URL** (e.g. `https://....onrender.com`).
- [ ] In Netlify, set **VITE_API_URL** to that URL and redeploy the frontend.

---

## Notes

- **Free tier:** The service **sleeps** after ~15 minutes of no traffic. The first request after sleep can take 30–60 seconds; then it’s fast again.
- **Database:** `db.json` and `server/uploads/` live on Render’s disk. They can reset on redeploys or if the instance is recycled; for a college project this is usually fine.
- **CORS:** Your `server.js` already uses `cors()`, so requests from your Netlify URL are allowed.

If something fails, check the **Logs** tab on your Render service for errors (e.g. “Missing script: start” or “Port 5000”).
