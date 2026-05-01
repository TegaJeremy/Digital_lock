import { useState } from 'react';
import { Eye, EyeOff, Copy, Pencil, Trash2 } from 'lucide-react';

const AVATAR_COLORS = ['av-purple', 'av-teal', 'av-coral', 'av-blue', 'av-amber'];
const CATEGORY_CLASSES = {
  crypto: 'cat-crypto',
  social: 'cat-social',
  banking: 'cat-banking',
  email: 'cat-email',
  other: 'cat-other',
};

const EntryCard = ({ entry, onEdit, onDelete, onCopy, isOffline }) => {
  const [showPassword, setShowPassword] = useState(false);

  const initials = entry.platform?.slice(0, 2).toUpperCase() || '??';
  const avatarClass = AVATAR_COLORS[entry.platform?.charCodeAt(0) % AVATAR_COLORS.length];
  const categoryClass = CATEGORY_CLASSES[entry.category] || 'cat-other';

  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <div className={`entry-avatar ${avatarClass}`}>{initials}</div>
        <div className="entry-card-actions">
          {!isOffline && (
            <>
              <button
                className="icon-btn"
                onClick={() => onEdit(entry)}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className="icon-btn"
                onClick={() => onDelete(entry.id)}
                title="Delete"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="entry-platform">{entry.platform}</div>
      {entry.username && (
        <div className="entry-username">{entry.username}</div>
      )}

      {entry.category && (
        <span className={`entry-category ${categoryClass}`}>
          {entry.category}
        </span>
      )}

      <div className="entry-password-row">
        <span className="entry-password-value">
          {showPassword
            ? entry.encrypted_password
            : '•'.repeat(Math.min(entry.encrypted_password?.length || 12, 18))}
        </span>
        <button
          className="btn-ghost icon-btn"
          onClick={() => setShowPassword((p) => !p)}
          title={showPassword ? 'Hide' : 'Show'}
          style={{ border: 'none', width: 'auto', height: 'auto' }}
        >
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          className="btn-ghost icon-btn"
          onClick={() => onCopy(entry.encrypted_password)}
          title="Copy password"
          style={{ border: 'none', width: 'auto', height: 'auto' }}
        >
          <Copy size={14} />
        </button>
      </div>

      {entry.notes && (
        <div className="entry-notes">{entry.notes}</div>
      )}
    </div>
  );
};

export default EntryCard;