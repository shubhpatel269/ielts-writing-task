# IELTS Writing Practice & Submission System (Task 1 & Task 2)

Full-stack web application for IELTS Writing practice: students write Task 1 or Task 2, upload images (Task 1), use a timed editor with word count, export as PDF, and submit. Teacher (Prarthana mam) can view all submissions and download PDFs. Data is stored in a JSON file; no SQL, no cloud.

---

## Tech Stack

| Layer   | Technology                          |
|--------|--------------------------------------|
| Frontend | React (Vite), Plain CSS, jsPDF      |
| Backend  | Node.js, Express.js                  |
| Database | JSON file (`server/db.json`)         |
| Storage  | File system (`server/uploads/`)      |

---

## Project Structure

```
ielts-writing-task/
│
├── client/                    # React (Vite) frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── styles.css
│   │   └── components/
│   │       ├── StudentPanel.jsx   # Student: name, roll, task, editor, timer, submit
│   │       ├── TeacherPanel.jsx   # Teacher: login, table, view/download PDF
│   │       ├── TaskEditor.jsx     # ContentEditable essay + word count + bold
│   │       └── Timer.jsx          # Start / Reset timer
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # Node + Express backend
│   ├── server.js              # API + file handling
│   ├── db.json                # JSON database (submissions)
│   ├── uploads/
│   │   ├── images/            # Task 1 images
│   │   └── pdfs/              # Generated PDFs
│   └── package.json
│
└── README.md
```

---

## How to Run

### 1. Install dependencies

**Server:**

```bash
cd server
npm install
```

**Client:**

```bash
cd client
npm install
```

### 2. Start the server

From the project root:

```bash
cd server
npm start
```

Server runs at **http://localhost:5000**.

### 3. Start the client

In a **second terminal**:

```bash
cd client
npm run dev
```

Client runs at **http://localhost:3000** and proxies `/api` and `/uploads` to the server.

### 4. Use the app

- Open **http://localhost:3000** in the browser.
- **Student:** Enter Name, choose Task 1 or Task 2, enter question, (Task 1: upload image), write essay, use timer, then **Submit**.
- **Teacher:** Switch to Teacher tab, log in, then view submissions and **View PDF** / **Download PDF**.

---

## Upload to GitHub

To put the whole project on GitHub (without `node_modules` or build files), see **[GITHUB.md](./GITHUB.md)** for step-by-step instructions.

---

## Teacher Login (Prarthana mam)

| Field    | Value           |
|----------|-----------------|
| Username | `teacher`       |
| Password | `prarthana@123` |

---

## API Endpoints

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/api/login`        | Teacher login (returns token)  |
| POST   | `/api/submit`       | Student submission (PDF + optional image + metadata) |
| GET    | `/api/submissions`  | List all submissions (teacher; requires `Authorization: Bearer <token>`) |
| GET    | `/api/download/:id` | Download PDF (teacher)         |
| GET    | `/api/view/:id`     | View PDF in browser (teacher)  |

---

## JSON Database (`server/db.json`)

```json
{
  "submissions": [
    {
      "id": "uuid",
      "studentName": "Shubh Patel",
      "taskType": "Task 1",
      "question": "The chart shows...",
      "wordCount": 168,
      "timeSpent": "19m 32s",
      "imagePath": "/uploads/images/uuid.png",
      "pdfPath": "/uploads/pdfs/uuid.pdf",
      "submittedAt": "2026-02-02T10:45:00"
    }
  ]
}
```

---

## Features Summary

- **Student:** Simple auth (name only), Task 1 / Task 2, question box, Task 1 image upload, ContentEditable editor (no spellcheck, bold only), word count (essay + selected), timer, PDF generation (name, task, question, image, essay, word count, time), submit to server.
- **Teacher:** Login with username/password, table of submissions (name, task, word count, time, date), View PDF, Download PDF.
- **Backend:** Validates data, writes to `db.json`, stores files in `uploads/images` and `uploads/pdfs`, serves PDFs/images, teacher routes protected by token.

---

## Deploying (Netlify)

- **Frontend:** Deploy the React app to Netlify (build from `client`, publish `client/dist`).
- **Backend:** Netlify does not run Node servers or store files. Deploy the backend to **Render**, **Railway**, or similar, then set the env var **VITE_API_URL** on Netlify to that backend URL so the frontend can call the API.

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step Netlify + Render instructions.

---

## Notes

- No Firebase, MongoDB, or MySQL; JSON file only.
- PDFs and images are stored on disk under `server/uploads/`.
- Teacher token is in-memory; restarting the server logs the teacher out.
