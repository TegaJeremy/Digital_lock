import { Sun, Moon, LogOut, Cloud, CloudOff } from 'lucide-react';
import { signOut } from '../lib/supabase';
import { connectGoogleDrive, isConnected } from '../lib/googleDrive';
import { useState, useEffect } from 'react';

const Navbar = ({ darkMode, toggleDarkMode, onLogout, driveReady, onDriveConnected }) => {
  const [driveConnected, setDriveConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const check = () => setDriveConnected(isConnected());
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [driveReady]);

  const handleDriveConnect = async () => {
  if (driveConnected) return;
  setConnecting(true);
  try {
    await connectGoogleDrive();
    setDriveConnected(true);
    if (onDriveConnected) await onDriveConnected();
  } catch (e) {
    console.error('Drive connect failed:', e);
  } finally {
    setConnecting(false);
  }
};

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>🔐</span>
        <span>TJeremy's <span>Vault</span></span>
      </div>
      <div className="navbar-actions">
        <button
          className={`backup-badge ${driveConnected ? '' : 'disconnected'}`}
          onClick={handleDriveConnect}
          title={driveConnected ? 'Google Drive backup active' : 'Click to connect Google Drive backup'}
        >
          {driveConnected ? <Cloud size={13} /> : <CloudOff size={13} />}
          {connecting ? 'Connecting...' : driveConnected ? 'Backup on' : 'Connect backup'}
        </button>
        <button
          className="icon-btn"
          onClick={toggleDarkMode}
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          className="icon-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;