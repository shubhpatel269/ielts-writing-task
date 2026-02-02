# How to Upload This Project to GitHub

Follow these steps to put your whole project on GitHub (no `node_modules` or build files—they’re in `.gitignore`).

---

## 1. Create a GitHub account (if you don’t have one)

- Go to [github.com](https://github.com) and sign up.

---

## 2. Install Git (if needed)

- Download from [git-scm.com](https://git-scm.com/downloads).
- Run the installer and use the defaults.
- Restart your terminal/VS Code after installing.

---

## 3. Create a new repository on GitHub

1. On GitHub, click the **+** (top right) → **New repository**.
2. **Repository name:** e.g. `ielts-writing-task`.
3. **Description:** optional (e.g. "IELTS Writing Practice & Submission System").
4. Choose **Public**.
5. **Do not** check "Add a README" or "Add .gitignore" (you already have them).
6. Click **Create repository**.

---

## 4. Upload the project from your computer

Open **PowerShell** or **Command Prompt** in your project folder (e.g. `C:\Users\Admin\Desktop\ielts-writing-task`).

**If Git is not initialized yet:**

```powershell
git init
git add .
git commit -m "Initial commit: IELTS Writing Practice project"
```

**If you already have a GitHub repo URL** (from step 3, e.g. `https://github.com/YourUsername/ielts-writing-task.git`):

```powershell
git remote add origin https://github.com/YourUsername/ielts-writing-task.git
git branch -M main
git push -u origin main
```

Replace `YourUsername` and `ielts-writing-task` with your GitHub username and repo name.

**If Git asked you to set your name and email (first time):**

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Then run `git commit` again if needed, then `git push` as above.

---

## 5. Summary of commands (copy-paste)

Run these **in order** inside your project folder (`ielts-writing-task`):

```powershell
git init
git add .
git commit -m "Initial commit: IELTS Writing Practice project"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace:
- `YOUR_USERNAME` → your GitHub username  
- `YOUR_REPO_NAME` → the repository name you created (e.g. `ielts-writing-task`)

When you `git push`, GitHub may ask you to sign in (browser or token). Use your GitHub account.

---

## What gets uploaded?

- **Included:** All source code (`client/src`, `server`), `package.json`, `README.md`, `DEPLOY.md`, `db.json`, `.gitignore`, etc.
- **Excluded (by .gitignore):** `node_modules/`, `client/dist/`, `.env` files, so the repo stays small and clean.

After pushing, your project will be at:  
`https://github.com/YourUsername/ielts-writing-task`
