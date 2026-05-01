import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { signIn, cacheCredentials, getCachedCredentials } from '../lib/supabase';
import { readBackup, ensureConnected, connectGoogleDrive  } from '../lib/googleDrive';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const handleLogin = async (e) => {
  e.preventDefault();
  if (!email || !password) {
    setError('Please enter your email and password');
    return;
  }
  setLoading(true);
  setError('');
  try {
    const data = await signIn(email, password);
    cacheCredentials(email, password);
    try {
      await connectGoogleDrive();
    } catch (driveErr) {
      console.warn('Drive connect skipped:', driveErr);
    }
    onLoginSuccess(data.session, password);
  } catch (err) {
    console.warn('Supabase auth failed, trying fallback...', err);
    await tryFallbackLogin(email, password);
  } finally {
    setLoading(false);
  }
};


  const tryFallbackLogin = async (email, password) => {
    try {
      const cached = getCachedCredentials();
      if (!cached) {
        setError('Cannot reach server and no offline credentials found. Login with internet first.');
        return;
      }
      if (cached.email !== email || cached.password !== password) {
        setError('Incorrect email or password.');
        return;
      }
      setError('');
      setLoading(true);
      const connected = await ensureConnected();
      if (!connected) {
        setError('Supabase is down and Google Drive connection failed. Check your internet.');
        return;
      }
      const backup = await readBackup();
      if (!backup) {
        setError('Supabase is down and no backup data found in Google Drive.');
        return;
      }
      setUsingFallback(true);
      const fakeSession = {
        user: { id: 'offline', email: cached.email },
        access_token: 'offline',
      };
      onLoginSuccess(fakeSession, password);
    } catch (e) {
      setError('Login failed. Please check your connection and try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h1>TJeremy's Vault</h1>
          <p>Enter your credentials to unlock</p>
        </div>

        {error && <div className="banner banner-error">{error}</div>}
        {usingFallback && (
          <div className="banner banner-warning">
            Running in offline mode — data loaded from Google Drive backup
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Lock size={15} />
            {loading ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;