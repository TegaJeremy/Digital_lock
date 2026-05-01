import { useState } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
import Navbar from './Navbar';
import EntryCard from './EntryCard';
import AddEditModal from './AddEditModal';
import { useVault } from '../hooks/useVault';

const CATEGORIES = ['all', 'crypto', 'social', 'banking', 'email', 'other'];

const Dashboard = ({ session, password, darkMode, toggleDarkMode, onLogout, driveReady }) => {
  const { entries, loading, error, usingBackup, isOffline, addEntry, editEntry, removeEntry } = useVault(session?.user, password);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const filtered = entries.filter((e) => {
    const matchSearch =
      !search ||
      e.platform?.toLowerCase().includes(search.toLowerCase()) ||
      e.username?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || e.category === category;
    return matchSearch && matchCategory;
  });

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingEntry) {
        await editEntry(editingEntry.id, formData);
        showToast('Entry updated');
      } else {
        await addEntry(formData);
        showToast('Entry added');
      }
      setModalOpen(false);
      setEditingEntry(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleDriveConnected = async () => {
  if (entries.length === 0) return;
  try {
    const { encryptEntry } = await import('../lib/crypto');
    const { writeBackup } = await import('../lib/googleDrive');
    const allEncrypted = entries.map((e) => encryptEntry(e, password));
    await writeBackup(allEncrypted);
    showToast('All entries synced to backup');
  } catch (e) {
    console.error('Sync on connect failed:', e);
  }
};

  const handleDelete = async (id) => {
    await removeEntry(id);
    setConfirmDelete(null);
    showToast('Entry deleted');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard — clears in 30s');
      setTimeout(() => navigator.clipboard.writeText(''), 30000);
    });
  };

  const categoryCounts = entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Navbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={onLogout}
        driveReady={driveReady}
         onDriveConnected={handleDriveConnected}
      />

      <div className="dashboard">
        {usingBackup && (
          <div className="banner banner-warning">
            ⚠️ Supabase unavailable — showing data from Google Drive backup. Read only mode until connection is restored.
          </div>
        )}
        {error && <div className="banner banner-error">{error}</div>}

        <div className="dashboard-header">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Your entries
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {entries.length} saved · all encrypted
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: 'auto' }}
            onClick={() => { setEditingEntry(null); setModalOpen(true); }}
            disabled={isOffline}
            title={isOffline ? 'Read only — Supabase is unavailable' : ''}
          >
            <Plus size={15} />
            Add entry
          </button>
        </div>

        <div className="dashboard-stats">
          {['crypto', 'social', 'banking', 'email', 'other'].map((cat) => (
            <div
              key={cat}
              className="stat-card"
              style={{ cursor: 'pointer', outline: category === cat ? '2px solid var(--accent)' : 'none' }}
              onClick={() => setCategory(cat === category ? 'all' : cat)}
            >
              <div className="stat-value">{categoryCounts[cat] || 0}</div>
              <div className="stat-label">{cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
            </div>
          ))}
        </div>

        <div className="search-filter">
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search platform or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Shield size={48} strokeWidth={1} /></div>
            <p>{entries.length === 0 ? 'No entries yet. Add your first password.' : 'No results found.'}</p>
          </div>
        ) : (
          <div className="entries-grid">
            {filtered.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={(id) => setConfirmDelete(id)}
                onCopy={handleCopy}
                isOffline={isOffline}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && !isOffline && (
        <AddEditModal
          entry={editingEntry}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingEntry(null); }}
          loading={saving}
        />
      )}

      {confirmDelete && !isOffline && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2>Delete entry?</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              This will permanently delete this entry from your vault and backup. This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
};

export default Dashboard;