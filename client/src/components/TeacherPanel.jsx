/**
 * Teacher Panel: Login (teacher / prarthana@123), table of submissions, View/Download PDF.
 * Teacher-only "Download PDF (grammar)" generates a PDF with grammar mistakes underlined in red.
 */
import { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

// In production (Netlify), set VITE_API_URL to your backend URL
const API_BASE = import.meta.env.VITE_API_URL || '';

// Build runs (normal vs error) from text and grammar matches; merge overlapping ranges
function buildRuns(text, matches) {
  if (!matches || matches.length === 0) return [{ text, isError: false }];
  const ranges = matches
    .map((m) => [m.offset, m.offset + m.length])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of ranges) {
    if (merged.length && start <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
    } else merged.push([start, end]);
  }
  const inError = (i) => merged.some(([s, e]) => i >= s && i < e);
  const runs = [];
  let i = 0;
  while (i < text.length) {
    const err = inError(i);
    let j = i;
    while (j < text.length && inError(j) === err) j++;
    runs.push({ text: text.slice(i, j), isError: err });
    i = j;
  }
  return runs;
}

// Draw essay text with red underlines for error runs; returns final y
function drawEssayWithGrammar(doc, essayText, matches, margin, startY, pageW, lineH = 6) {
  const maxW = pageW - 2 * margin;
  let x = margin;
  let y = startY;
  doc.setFontSize(10);
  const runs = buildRuns(essayText || '', matches);
  for (const run of runs) {
    doc.setTextColor(run.isError ? 180 : 0, run.isError ? 0 : 0, run.isError ? 0 : 0);
    const parts = run.text.split(/(\s+)/);
    for (const part of parts) {
      if (part.includes('\n')) {
        const lines = part.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            x = margin;
            y += lineH;
          }
          const w = doc.getTextWidth(lines[i]);
          if (w > 0) {
            doc.text(lines[i], x, y);
            if (run.isError) {
              doc.setDrawColor(220, 0, 0);
              doc.setLineWidth(0.5);
              doc.line(x, y + 2, x + w, y + 2);
              doc.setDrawColor(0, 0, 0);
            }
            x += w;
          }
        }
        continue;
      }
      const w = doc.getTextWidth(part);
      if (w === 0) continue;
      if (x + w > margin + maxW && x > margin) {
        x = margin;
        y += lineH;
      }
      doc.text(part, x, y);
      if (run.isError) {
        doc.setDrawColor(220, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(x, y + 2, x + w, y + 2);
        doc.setDrawColor(0, 0, 0);
      }
      x += w;
    }
    doc.setTextColor(0, 0, 0);
  }
  return y + lineH;
}

function TeacherPanel({ token, onLogin, onLogout }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterChecked, setFilterChecked] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const debouncedName = useDebounce(filterName, 400);

  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedName.trim()) params.set('search', debouncedName.trim());
      if (filterTaskType) params.set('taskType', filterTaskType);
      if (filterDate) params.set('date', filterDate);
      if (filterChecked) params.set('checked', filterChecked);
      const qs = params.toString();
      const url = `${API_BASE}/api/submissions${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (_) {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [token, onLogout, debouncedName, filterTaskType, filterDate, filterChecked]);

  useEffect(() => {
    if (token) fetchSubmissions();
  }, [token, fetchSubmissions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchSubmissions();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleChecked = async (sub) => {
    const next = !sub.checked;
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${sub.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checked: next }),
      });
      if (res.ok) fetchSubmissions();
    } catch (_) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        onLogin(data.token);
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (_) {
      setLoginError('Network error');
    }
  };

  const handleViewPdf = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/view/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setViewingPdf(url);
      window.open(url, '_blank');
    } catch (_) {}
  };

  const handleDownloadPdf = (id) => {
    const url = `${API_BASE}/api/download/${id}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    link.style.display = 'none';
    document.body.appendChild(link);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = `submission-${id}.pdf`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .finally(() => link.remove());
  };

  // Teacher-only: generate PDF with grammar mistakes underlined in red (LanguageTool)
  const handleDownloadPdfGrammar = async (sub) => {
    const essayText = sub.essayText || '';
    let matches = [];
    if (essayText.trim()) {
      try {
        const res = await fetch(`${API_BASE}/api/grammar-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: essayText }),
        });
        const data = await res.json();
        matches = data.matches || [];
      } catch (_) {
        matches = [];
      }
    }
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 16;
    const lineH = 6;
    const margin = 14;

    const addText = (label, value) => {
      if (value == null || value === '') return;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, y);
      y += lineH;
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(String(value), pageW - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * lineH + 2;
    };

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(sub.studentName || '—', margin, y);
    doc.text(`${sub.timeSpent || '—'}  |  ${sub.wordCount ?? '—'} words`, pageW - margin, y, { align: 'right' });
    y += lineH + 2;

    addText('Task Type:', sub.taskType);
    addText('Question:', sub.question);

    doc.setFont(undefined, 'bold');
    doc.text('Essay (grammar mistakes in red):', margin, y);
    y += lineH;
    doc.setFont(undefined, 'normal');
    y = drawEssayWithGrammar(doc, essayText || '(no essay text stored)', matches, margin, y, pageW, lineH);
    y += 2;
    addText('Submitted At:', sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '');

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-grammar-${sub.studentName || sub.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Not logged in: show login form
  if (!token) {
    return (
      <div className="panel">
        <h2>Teacher Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>
          {loginError && <p className="error-msg">{loginError}</p>}
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
      </div>
    );
  }

  // Logged in: show dashboard
  return (
    <div className="panel">
      <h2>Teacher Dashboard (Prarthana mam)</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
        View and download student submissions. Latest submissions appear first.
      </p>

      <div className="teacher-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="Search by name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterTaskType}
          onChange={(e) => setFilterTaskType(e.target.value)}
        >
          <option value="">All tasks</option>
          <option value="Task 1">Task 1</option>
          <option value="Task 2">Task 2</option>
        </select>
        <input
          type="date"
          className="filter-input filter-date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterChecked}
          onChange={(e) => setFilterChecked(e.target.value)}
        >
          <option value="">All</option>
          <option value="checked">Checked</option>
          <option value="unchecked">Unchecked</option>
        </select>
        <button type="button" className="btn btn-secondary" onClick={fetchSubmissions} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p style={{ marginTop: '1rem' }}>Loading submissions...</p>
      ) : (
        <div className="submissions-table-wrap">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Task Type</th>
                <th>Word Count</th>
                <th>Time Spent</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem' }}>
                    No submissions match your filters.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.studentName}</td>
                    <td>{sub.taskType}</td>
                    <td>{sub.wordCount}</td>
                    <td>{sub.timeSpent}</td>
                    <td>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '-'}</td>
                    <td>
                      {sub.checked ? (
                        <>
                          <span className="badge badge-checked">Checked</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleToggleChecked(sub)}
                            title="Unmark"
                          >
                            Unmark
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleToggleChecked(sub)}
                        >
                          Mark as checked
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleViewPdf(sub.id)}
                        >
                          View PDF
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDownloadPdf(sub.id)}
                        >
                          Download PDF
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDownloadPdfGrammar(sub)}
                          title="PDF with grammar mistakes underlined in red"
                        >
                          PDF (grammar)
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deletingId === sub.id}
                        >
                          {deletingId === sub.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TeacherPanel;
