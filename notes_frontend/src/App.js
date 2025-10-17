import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { getNotes, createNote } from './services/notes';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [notes, setNotes] = useState([]);
  const [notesError, setNotesError] = useState(null);
  const supabaseConfigured =
    Boolean(process.env.REACT_APP_SUPABASE_URL) &&
    Boolean(process.env.REACT_APP_SUPABASE_KEY);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch notes only if Supabase is configured; avoid breaking existing app
  useEffect(() => {
    let isMounted = true;
    if (!supabaseConfigured) return;
    (async () => {
      const { data, error } = await getNotes();
      if (!isMounted) return;
      if (error) {
        setNotesError(error.message || 'Failed to load notes.');
      } else {
        setNotes(data || []);
        setNotesError(null);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [supabaseConfigured]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Minimal create handler for demo; no form UI changes to keep non-breaking
  const handleQuickCreate = async () => {
    const title = 'Quick Note';
    const content = 'This is a quick note created from the demo button.';
    const { data, error } = await createNote({ title, content });
    if (error) {
      setNotesError(error.message || 'Failed to create note.');
      return;
    }
    setNotes(prev => [data, ...prev]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          Current theme: <strong>{theme}</strong>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>

        {/* Feature-guarded Supabase demo: list notes and a quick-create button */}
        {supabaseConfigured ? (
          <div style={{ marginTop: 24, width: '100%', maxWidth: 640 }}>
            <h3 style={{ marginBottom: 8 }}>Notes (Supabase)</h3>
            <button
              className="theme-toggle"
              style={{ position: 'static', marginBottom: 12 }}
              onClick={handleQuickCreate}
            >
              ➕ Quick Create Note
            </button>
            {notesError && (
              <div style={{ color: '#EF4444', marginBottom: 8 }}>
                {notesError}
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
              {(notes || []).map(n => (
                <li
                  key={n.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ opacity: 0.85, marginTop: 4 }}>{n.content}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </div>
                </li>
              ))}
              {notes && notes.length === 0 && (
                <li style={{ opacity: 0.75 }}>No notes yet.</li>
              )}
            </ul>
          </div>
        ) : (
          <div style={{ marginTop: 24, maxWidth: 640 }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your environment to enable notes.
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
