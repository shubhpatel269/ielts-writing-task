/**
 * Timer: Start / Reset. Time is stored with submission.
 */
import { useState, useRef, useEffect } from 'react';

function Timer({ onTimeChange }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (onTimeChange) onTimeChange(formatTime(next));
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onTimeChange]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const start = () => setRunning(true);
  const reset = () => {
    setRunning(false);
    setSeconds(0);
    if (onTimeChange) onTimeChange('0m 0s');
  };

  return (
    <div className="timer-box">
      <span>{formatTime(seconds)}</span>
      <div className="timer-buttons">
        <button type="button" className="btn btn-primary" onClick={start} disabled={running}>
          Start
        </button>
        <button type="button" className="btn btn-secondary" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default Timer;
export const formatTimerSeconds = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
};
