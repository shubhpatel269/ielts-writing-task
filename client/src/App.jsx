/**
 * IELTS Writing Practice & Submission System
 * App entry: Student view vs Teacher view (login protected)
 */
import { useState, useCallback } from 'react';
import StudentPanel from './components/StudentPanel';
import TeacherPanel from './components/TeacherPanel';

function App() {
  const [view, setView] = useState('student'); // 'student' | 'teacher'
  const [teacherToken, setTeacherToken] = useState(() =>
    localStorage.getItem('teacherToken')
  );

  const onTeacherLogin = useCallback((token) => {
    localStorage.setItem('teacherToken', token);
    setTeacherToken(token);
    setView('teacher');
  }, []);

  const onTeacherLogout = useCallback(() => {
    localStorage.removeItem('teacherToken');
    setTeacherToken(null);
    setView('student');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>IELTS Writing Practice & Submission</h1>
        <nav>
          <button
            type="button"
            className={view === 'student' ? 'active' : ''}
            onClick={() => setView('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={view === 'teacher' ? 'active' : ''}
            onClick={() => (teacherToken ? onTeacherLogout() : setView('teacher'))}
          >
            {teacherToken ? 'Logout (Teacher)' : 'Teacher'}
          </button>
        </nav>
      </header>
      <main className="app-main">
        {view === 'student' && <StudentPanel />}
        {view === 'teacher' && (
          <TeacherPanel
            token={teacherToken}
            onLogin={onTeacherLogin}
            onLogout={onTeacherLogout}
          />
        )}
      </main>
    </div>
  );
}

export default App;
