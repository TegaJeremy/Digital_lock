import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { initGoogleDrive } from './lib/googleDrive';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App = () => {
  const [session, setSession] = useState(null);
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('tj_theme') === 'dark';
  });
  const [loading, setLoading] = useState(true);
  const [driveReady, setDriveReady] = useState(false);

  useEffect(() => {
    initGoogleDrive().then(() => {
      setDriveReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) setPassword('');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('tj_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLoginSuccess = (sessionData, userPassword) => {
    setSession(sessionData);
    setPassword(userPassword);
  };

  const handleLogout = () => {
    setSession(null);
    setPassword('');
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="app">
      {!session || !password ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard
          session={session}
          password={password}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
          driveReady={driveReady}
        />
      )}
    </div>
  );
};

export default App;