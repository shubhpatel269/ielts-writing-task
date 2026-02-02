/**
 * TaskEditor: ContentEditable essay area.
 * No spellcheck, bold only for selected text, word count (essay + selected).
 */
import { useRef, useState, useCallback, useEffect } from 'react';

function TaskEditor({ value, onChange, wordCount, onWordCountChange, disabled }) {
  const editorRef = useRef(null);
  const [selectedWordCount, setSelectedWordCount] = useState(0);

  // Count words in plain text (question and image excluded; essay only)
  const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean).length;
  };

  const updateCount = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText || '';
    const count = countWords(text);
    onWordCountChange?.(count);
  }, [onWordCountChange]);

  const handleInput = useCallback(() => {
    updateCount();
    if (editorRef.current) onChange?.(editorRef.current.innerHTML);
  }, [onChange, updateCount]);

  const handleSelect = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setSelectedWordCount(0);
      return;
    }
    const text = sel.toString().trim();
    setSelectedWordCount(countWords(text));
  }, []);

  // Only sync value → editor when parent clears (e.g. after submit). Do NOT set on every
  // value change or cursor jumps to start after each keystroke (React re-render overwrites DOM).
  useEffect(() => {
    if (editorRef.current && value !== undefined && value === '') {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  // Force LTR so cursor stays on right and text is not reversed (fixes RTL inheritance)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.setAttribute('dir', 'ltr');
    el.style.direction = 'ltr';
    el.style.textAlign = 'left';
    el.style.unicodeBidi = 'isolate';
  }, []);

  useEffect(updateCount, [updateCount]);

  const applyBold = () => {
    document.execCommand('bold', false, null);
    editorRef.current?.focus();
    updateCount();
    if (editorRef.current) onChange?.(editorRef.current.innerHTML);
  };

  return (
    <div className="editor-section" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      <div className="word-count-bar" style={{ marginBottom: '0.5rem' }}>
        <label>Essay (content only)</label>
        <span className="selected-count">
          {selectedWordCount > 0 ? `Selected: ${selectedWordCount} words | ` : ''}
          Total: {wordCount} words
        </span>
      </div>
      <button
        type="button"
        className="toolbar-bold"
        onClick={applyBold}
        disabled={disabled}
        title="Bold selected text"
      >
        B
      </button>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!disabled}
        suppressContentEditableWarning
        dir="ltr"
        style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
        spellCheck={false}
        data-gramm={false}
        data-gramm_editor={false}
        data-enable-grammarly={false}
        onInput={handleInput}
        onSelect={handleSelect}
      />
    </div>
  );
}

export default TaskEditor;
