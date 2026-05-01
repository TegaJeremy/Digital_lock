import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw } from 'lucide-react';

const CATEGORIES = ['crypto', 'social', 'banking', 'email', 'other'];

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => chars[b % chars.length]).join('');
};

const AddEditModal = ({ entry, onSave, onClose, loading }) => {
  const [form, setForm] = useState({
    platform: '',
    username: '',
    encrypted_password: '',
    category: 'other',
    notes: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (entry) {
      setForm({
        platform: entry.platform || '',
        username: entry.username || '',
        encrypted_password: entry.encrypted_password || '',
        category: entry.category || 'other',
        notes: entry.notes || '',
      });
    }
  }, [entry]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.platform || !form.encrypted_password) {
      setError('Platform and password are required');
      return;
    }
    await onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{entry ? 'Edit Entry' : 'New Entry'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <div className="form-group">
          <label>Platform / App name *</label>
          <input
            type="text"
            placeholder="e.g. Binance, Gmail, Twitter"
            value={form.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Username / Email</label>
          <input
            type="text"
            placeholder="your@email.com"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password / Seed phrase *</label>
          <div className="input-wrapper" style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password or seed phrase"
                value={form.encrypted_password}
                onChange={(e) => handleChange('encrypted_password', e.target.value)}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', padding: '0 0.75rem' }}
              onClick={() => handleChange('encrypted_password', generatePassword())}
              title="Generate password"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            placeholder="Any extra info — recovery email, 2FA backup, hints..."
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : entry ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditModal;