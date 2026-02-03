# Deploying IELTS Writing Practice

Your app has two parts:

1. **Frontend (React)** – can be hosted on **Netlify**
2. **Backend (Node/Express)** – Netlify does **not** run long‑running servers or store files, so the backend must be hosted elsewhere (e.g. **Render**)

---

## 1. Deploy the backend (e.g. Render)

Netlify cannot run your Express server or keep `db.json` and uploaded files. Use a service that runs Node.js:

### Option A: Render (free tier)

**→ Full step-by-step: [RENDER.md](./RENDER.md)**

Quick summary:

1. Go to [render.com](https://render.com) and sign up (GitHub recommended).
2. **New → Web Service** → connect your GitHub repo.
3. **Root directory:** `server` (so Render uses the `server` folder).
4. **Build command:** `npm install`  
   **Start command:** `npm start`
5. **Environment:** Add `NODE_VERSION` = `18` (optional).
6. **Create Web Service** → wait for **Live** → copy the URL (e.g. `https://....onrender.com`).
7. In Netlify, set **VITE_API_URL** to that URL and redeploy the frontend.

**Important:** On the free tier, the server sleeps after inactivity; the first request after sleep can be slow.

### Option B: Railway, Fly.io, or a VPS

- Same idea: run `server` as a Node app, set **Start command** to `npm start`, and use the URL they give you as the backend URL below.

---

## 2. Deploy the frontend on Netlify

### From the Netlify website (recommended)

1. Go to [netlify.com](https://www.netlify.com) and sign up / log in.
2. **Add new site → Import an existing project**.
3. Connect your Git provider (GitHub, GitLab, etc.) and select the repo.
4. **Build settings:**
   - **Base directory:** leave empty (or `client` if your repo root is one level above `client`).
   - **Build command:**  
     - If base directory is empty: `cd client && npm install && npm run build`  
     - If base directory is `client`: `npm install && npm run build`
   - **Publish directory:**  
     - If base directory is empty: `client/dist`  
     - If base directory is `client`: `dist`
5. **Environment variables** (Site settings → Environment variables):
   - **Key:** `VITE_API_URL`  
   - **Value:** your backend URL **with no trailing slash**, e.g. `https://ielts-writing-xxxx.onrender.com`
6. **Deploy site.**

Netlify will build the React app and serve it; the app will call your backend using `VITE_API_URL`.

### Deploy by direct file upload (no Git)

1. **Build the frontend on your computer** (so the API URL is baked in):
   - **Windows (PowerShell):**
     ```powershell
     cd client
     npm install
     $env:VITE_API_URL="https://your-backend.onrender.com"
     npm run build
     ```
   - Replace `https://your-backend.onrender.com` with your real backend URL, or use `""` if you don’t have a backend yet (submit/view PDF won’t work until you set it and rebuild).
   - **macOS/Linux:**
     ```bash
     cd client
     npm install
     VITE_API_URL=https://your-backend.onrender.com npm run build
     ```
2. **Upload the built folder to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Deploy manually** (or **Sites** → **Add new site** → **Deploy manually**).
   - Drag and drop the **`client/dist`** folder (the whole folder, not its contents) into the drop zone.
   - Netlify will publish it and give you a URL (e.g. `https://random-name-123.netlify.app`).

No Git or Netlify CLI needed. To update the site, change code, run the same build again, then drag and drop `client/dist` once more.

### Deploy from your computer (Netlify CLI)

```bash
# Install Netlify CLI once
npm install -g netlify-cli

# Build the client with your backend URL (replace with your real URL)
cd client
set VITE_API_URL=https://your-backend.onrender.com
npm run build

# Deploy the built site
cd ..
netlify deploy --prod --dir=client/dist
```

If you use **Git** and set `VITE_API_URL` in Netlify’s **Environment variables**, you don’t need to set it in the terminal; Netlify will use it during the build.

---

## 3. CORS

Your backend already uses `cors()` in Express, so requests from your Netlify URL (e.g. `https://your-site.netlify.app`) to the backend are allowed. No extra CORS config is needed unless you lock CORS down to specific origins later.

---

## 4. Summary

| Part      | Where        | URL you get                    |
|----------|--------------|---------------------------------|
| Frontend | Netlify      | `https://your-site.netlify.app` |
| Backend  | Render / etc | `https://your-app.onrender.com` |

- Set **VITE_API_URL** on Netlify to the backend URL.
- Users open the **Netlify URL**; the React app runs there and talks to the backend for submissions, PDFs, and grammar check.

---

## 5. If you have no backend URL yet

You can still deploy only the frontend on Netlify:

1. Build: **Build command** `cd client && npm install && npm run build`, **Publish directory** `client/dist`.
2. Do **not** set `VITE_API_URL` (or leave it empty).
3. The site will load, but **Submit**, **View PDF**, and **Teacher** features will fail until you deploy the backend and set `VITE_API_URL` to that URL.
