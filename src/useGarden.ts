import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyGarden, parseGarden, type Garden } from './game';

export function useGarden(key: string) {
  const [initial] = useState(() => {
    try { const raw = localStorage.getItem(key); return { garden: raw ? parseGarden(raw) : emptyGarden(), warning: '', writable: true }; }
    catch { return { garden: emptyGarden(), warning: 'Saved garden could not be read. Progress will stay in memory for this visit.', writable: false }; }
  });
  const [garden, setGarden] = useState(initial.garden);
  const [storageWarning, setWarning] = useState(initial.warning);
  const latest = useRef(garden);
  const writable = useRef(initial.writable);
  const update = useCallback((producer: (previous: Garden) => Garden) => {
    let current = latest.current;
    if (writable.current) {
      try { const raw = localStorage.getItem(key); if (raw) current = parseGarden(raw); }
      catch { writable.current = false; setWarning('Storage is unavailable. Keep this page open to retain your progress.'); }
    }
    const next = producer(current);
    if (writable.current) {
      try { localStorage.setItem(key, JSON.stringify(next)); }
      catch { writable.current = false; setWarning('Storage is full or unavailable. Keep this page open to retain your progress.'); }
    }
    latest.current = next;
    setGarden(next);
    return next;
  }, [key]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key !== key || !e.newValue) return;
      try { const next = parseGarden(e.newValue); latest.current = next; setGarden(next); }
      catch { setWarning('Another tab saved unreadable garden data. Keep this garden open.'); }
    };
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  }, [key]);
  return { garden, update, latest, storageWarning };
}
