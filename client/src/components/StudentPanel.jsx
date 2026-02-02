/**
 * Student Panel: Name, Task 1/2, image (Task 1), question, editor, timer, PDF, submit.
 */
import { useState, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import Timer from './Timer';
import TaskEditor from './TaskEditor';

// In production (Netlify), set VITE_API_URL to your backend URL (e.g. https://your-app.onrender.com)
const API_BASE = import.meta.env.VITE_API_URL || '';

function StudentPanel() {
  const [studentName, setStudentName] = useState('');
  const [taskType, setTaskType] = useState('Task 1');
  const [question, setQuestion] = useState('');
  const [essayHtml, setEssayHtml] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState('0m 0s');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const onTimeChange = useCallback((t) => setTimeSpent(t), []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Strip HTML for word count and plain text in PDF
  const getPlainText = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  };

  // Convert image file to data URL for embedding in PDF (jsPDF works with base64)
  const imageToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Generate PDF: Name + time/word count on one line (left/right), Task type, Question, Image (Task 1), Essay. No roll number.
  const generatePdfBlob = (imageDataUrl = null) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 16;
    const lineH = 6;
    const margin = 14;

    const addText = (label, value) => {
      if (!value) return;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, y);
      y += lineH;
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(String(value), pageW - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * lineH + 2;
    };

    // Single line: name on left, time spent and word count on right (no labels, no roll number)
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(studentName.trim() || '—', margin, y);
    const rightText = `${timeSpent}  |  ${wordCount} words`;
    doc.text(rightText, pageW - margin, y, { align: 'right' });
    y += lineH + 2;

    addText('Task Type:', taskType);
    addText('Question:', question);

    if (taskType === 'Task 1' && imageDataUrl) {
      y += 2;
      doc.setFont(undefined, 'bold');
      doc.text('Image (chart/graph/diagram):', margin, y);
      y += lineH;
      try {
        const maxW = pageW - 2 * margin;
        const maxH = 55;
        doc.addImage(imageDataUrl, 'PNG', margin, y, maxW, maxH);
        y += maxH + 4;
      } catch (_) {
        doc.text('[Image attached]', margin, y);
        y += lineH;
      }
    }

    addText('Essay:', getPlainText(essayHtml));
    addText('Submitted At:', new Date().toLocaleString());

    return doc.output('blob');
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your Name.' });
      return;
    }
    if (!question.trim()) {
      setMessage({ type: 'error', text: 'Please enter the question.' });
      return;
    }
    if (wordCount === 0 || !getPlainText(essayHtml).length) {
      setMessage({ type: 'error', text: 'Please write your essay.' });
      return;
    }
    if (taskType === 'Task 1' && !imageFile) {
      setMessage({ type: 'error', text: 'Task 1 requires an image upload.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      let imageDataUrl = null;
      if (taskType === 'Task 1' && imageFile) {
        imageDataUrl = await imageToDataUrl(imageFile);
      }
      const pdfBlob = generatePdfBlob(imageDataUrl);
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'submission.pdf');
      if (imageFile) formData.append('image', imageFile);
      formData.append('studentName', studentName.trim());
      formData.append('taskType', String(taskType));
      formData.append('question', question.trim());
      formData.append('essayText', getPlainText(essayHtml));
      formData.append('wordCount', String(wordCount));
      formData.append('timeSpent', String(timeSpent || '0m 0s'));

      const res = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Submission failed.' });
        return;
      }
      setMessage({ type: 'success', text: 'Submitted successfully!' });
      setEssayHtml('');
      setWordCount(0);
      setQuestion('');
      removeImage();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <h2>Student Panel</h2>

      <div className="student-info-bar">
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label>Name</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <Timer onTimeChange={onTimeChange} />
      </div>

      <div className="task-tabs">
        <button
          type="button"
          className={taskType === 'Task 1' ? 'active' : ''}
          onClick={() => setTaskType('Task 1')}
        >
          Task 1
        </button>
        <button
          type="button"
          className={taskType === 'Task 2' ? 'active' : ''}
          onClick={() => setTaskType('Task 2')}
        >
          Task 2
        </button>
      </div>

      <div className="editor-section">
        <label>Question (not counted in words)</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Paste or type the question here..."
          rows={3}
        />
      </div>

      {taskType === 'Task 1' && (
        <div className="editor-section">
          <label>Upload image (chart / graph / diagram)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="uploaded-image-wrap" style={{ marginTop: '0.5rem' }}>
              <img src={imagePreview} alt="Uploaded" />
              <button type="button" className="btn btn-secondary" onClick={removeImage} style={{ marginTop: '0.5rem' }}>
                Remove image
              </button>
            </div>
          )}
        </div>
      )}

      <TaskEditor
        value={essayHtml}
        onChange={setEssayHtml}
        wordCount={wordCount}
        onWordCountChange={setWordCount}
      />

      <div style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        {message.text && (
          <p className={message.type === 'error' ? 'error-msg' : 'success-msg'}>{message.text}</p>
        )}
      </div>
    </div>
  );
}

export default StudentPanel;
