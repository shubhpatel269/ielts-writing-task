/**
 * IELTS Writing Practice - Backend Server
 * Express + JSON database. No SQL, no cloud.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Teacher credentials (Prarthana mam)
const TEACHER_USERNAME = 'teacher';
const TEACHER_PASSWORD = 'prarthana@123';

// In-memory token for teacher session (simple auth for college project)
let teacherToken = null;

// Paths
const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const PDFS_DIR = path.join(UPLOADS_DIR, 'pdfs');

// Ensure upload directories exist
[IMAGES_DIR, PDFS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer: one middleware for both PDF and image
const uploadSubmission = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = file.fieldname === 'pdf' ? PDFS_DIR : IMAGES_DIR;
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const id = uuidv4();
      if (file.fieldname === 'pdf') {
        cb(null, `${id}.pdf`);
      } else {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${id}${ext}`);
      }
    },
  }),
}).fields([{ name: 'pdf', maxCount: 1 }, { name: 'image', maxCount: 1 }]);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ---------- Helpers ----------
function readDb() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function isTeacherAuthorized(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return authHeader.slice(7) === teacherToken;
}

// ---------- Routes ----------

// Root: API server only. Use the React client at http://localhost:3000
app.get('/', (req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html><body style="font-family:sans-serif;padding:2rem;max-width:32rem;">
      <h1>IELTS Writing – API Server</h1>
      <p>This is the backend only. Open the app in your browser at:</p>
      <p><a href="http://localhost:3000">http://localhost:3000</a></p>
      <p>Make sure the client is running: <code>cd client && npm run dev</code></p>
    </body></html>
  `);
});

// POST /api/login - Teacher login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === TEACHER_USERNAME && password === TEACHER_PASSWORD) {
    teacherToken = uuidv4();
    return res.json({ success: true, token: teacherToken });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// POST /api/grammar-check - Teacher only; proxy to LanguageTool for red underlines in PDF
app.post('/api/grammar-check', async (req, res) => {
  if (!isTeacherAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const text = req.body && req.body.text != null ? String(req.body.text) : '';
  if (!text.trim()) {
    return res.json({ matches: [] });
  }
  try {
    const form = new URLSearchParams();
    form.append('text', text);
    form.append('language', 'en-US');
    const ltRes = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await ltRes.json();
    const matches = (data.matches || []).map((m) => ({
      offset: m.offset,
      length: m.length,
      message: m.message || '',
    }));
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ matches: [], error: 'Grammar check failed' });
  }
});

// POST /api/submit - Student submission (multer puts text fields in req.body)
app.post('/api/submit', (req, res) => {
  uploadSubmission(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'File upload failed' });
    }
    // Multer parses multipart and puts non-file fields in req.body (all values are strings)
    const body = req.body || {};
    const studentName = body.studentName != null ? String(body.studentName).trim() : '';
    const taskType = body.taskType != null ? String(body.taskType).trim() : '';
    const question = body.question != null ? String(body.question).trim() : '';
    const wordCount = body.wordCount != null && body.wordCount !== '' ? parseInt(body.wordCount, 10) : 0;
    const timeSpent = body.timeSpent != null && body.timeSpent !== '' ? String(body.timeSpent) : '0m 0s';

    const missing = [];
    if (!studentName) missing.push('studentName');
    if (!taskType) missing.push('taskType');
    if (!question) missing.push('question');
    if (Number.isNaN(wordCount)) missing.push('wordCount');
    if (missing.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields: ' + missing.join(', ') });
    }

    const pdfFile = req.files && req.files['pdf'] ? req.files['pdf'][0] : null;
    if (!pdfFile) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
    const id = path.basename(pdfFile.filename, '.pdf');
    const essayText = body.essayText != null ? String(body.essayText) : '';
    const submission = {
      id,
      studentName,
      taskType,
      question: question || '',
      essayText: essayText || '',
      wordCount: Number.isNaN(wordCount) ? 0 : wordCount,
      timeSpent,
      imagePath: imageFile ? `/uploads/images/${imageFile.filename}` : null,
      pdfPath: `/uploads/pdfs/${pdfFile.filename}`,
      submittedAt: new Date().toISOString(),
    };
    const db = readDb();
    db.submissions.push(submission);
    writeDb(db);
    res.status(201).json({ success: true, id: submission.id });
  });
});

// GET /api/submissions - Teacher only
app.get('/api/submissions', (req, res) => {
  if (!isTeacherAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const db = readDb();
  res.json(db.submissions);
});

// GET /api/download/:id - Teacher only; download PDF
app.get('/api/download/:id', (req, res) => {
  if (!isTeacherAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const db = readDb();
  const sub = db.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  const fullPath = path.join(__dirname, sub.pdfPath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ success: false, message: 'PDF file not found' });
  }
  res.download(fullPath, `submission-${sub.studentName}-${sub.taskType}.pdf`);
});

// GET /api/view/:id - Teacher only; serve PDF for viewing in browser
app.get('/api/view/:id', (req, res) => {
  if (!isTeacherAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const db = readDb();
  const sub = db.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  const fullPath = path.join(__dirname, sub.pdfPath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ success: false, message: 'PDF file not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(fullPath);
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${server.address().port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('To free it on Windows: netstat -ano | findstr :5000  then  taskkill /PID <pid> /F');
    console.error('Or use another port: set PORT=5001 && npm start\n');
    process.exit(1);
  }
  throw err;
});
