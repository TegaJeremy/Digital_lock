import { useState, useEffect, useCallback } from 'react';
import {
  fetchEntries,
  insertEntry,
  updateEntry,
  deleteEntry,
  addToQueue,
  processQueue,
} from '../lib/supabase';
import {
  encryptEntry,
  decryptEntry,
} from '../lib/crypto';
import {
  writeBackup,
  deleteFromBackup,
  readBackup,
  isConnected,
} from '../lib/googleDrive';

export const useVault = (user, password) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingBackup, setUsingBackup] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (user.id === 'offline') throw new Error('offline mode');
      await processQueue();
      const raw = await fetchEntries(user.id);
      const decrypted = raw.map((e) => decryptEntry(e, password));
      setEntries(decrypted);
      setUsingBackup(false);
      setIsOffline(false);
      if (isConnected()) {
        const allEncrypted = raw;
        await writeBackup(allEncrypted);
      }
    } catch (e) {
      console.warn('Supabase failed, trying backup...', e);
      if (isConnected()) {
        try {
          const backup = await readBackup();
          if (backup?.entries) {
            const decrypted = backup.entries.map((e) =>
              decryptEntry(e, password)
            );
            setEntries(decrypted);
            setUsingBackup(true);
            setIsOffline(true);
          }
        } catch (backupErr) {
          setError('Both Supabase and backup failed. Check your connection.');
        }
      } else {
        setError('Supabase is unavailable and no backup is connected.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, password]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const handleOnline = () => {
      if (isOffline) {
        loadEntries();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOffline, loadEntries]);

  const addEntry = async (entryData) => {
    setError(null);
    const toSave = {
      ...entryData,
      user_id: user.id,
      encrypted_password: entryData.encrypted_password,
    };
    const encrypted = encryptEntry(toSave, password);
    try {
      const saved = await insertEntry(encrypted);
      const decrypted = decryptEntry(saved, password);
      const updatedEntries = [decrypted, ...entries];
      setEntries(updatedEntries);
      if (isConnected()) {
        const allEncrypted = updatedEntries.map((e) => encryptEntry(e, password));
        await writeBackup(allEncrypted);
      }
      return decrypted;
    } catch (e) {
      addToQueue({ type: 'insert', entry: encrypted });
      if (isConnected()) {
        const tempEntry = { ...toSave, id: `temp_${Date.now()}` };
        const decrypted = decryptEntry(tempEntry, password);
        const updatedEntries = [decrypted, ...entries];
        setEntries(updatedEntries);
        const allEncrypted = updatedEntries.map((e) => encryptEntry(e, password));
        await writeBackup(allEncrypted);
      }
      throw e;
    }
  };

  const editEntry = async (id, entryData) => {
    setError(null);
    const toSave = {
      ...entryData,
      encrypted_password: entryData.encrypted_password,
    };
    const encrypted = encryptEntry(toSave, password);
    try {
      const saved = await updateEntry(id, encrypted);
      const decrypted = decryptEntry(saved, password);
      const updatedEntries = entries.map((e) => (e.id === id ? decrypted : e));
      setEntries(updatedEntries);
      if (isConnected()) {
        const allEncrypted = updatedEntries.map((e) => encryptEntry(e, password));
        await writeBackup(allEncrypted);
      }
      return decrypted;
    } catch (e) {
      addToQueue({ type: 'update', id, entry: encrypted });
      throw e;
    }
  };

  const removeEntry = async (id) => {
    setError(null);
    try {
      await deleteEntry(id);
      const updatedEntries = entries.filter((e) => e.id !== id);
      setEntries(updatedEntries);
      if (isConnected()) {
        await deleteFromBackup(id);
      }
    } catch (e) {
      addToQueue({ type: 'delete', id });
      throw e;
    }
  };

  return {
    entries,
    loading,
    error,
    usingBackup,
    isOffline,
    loadEntries,
    addEntry,
    editEntry,
    removeEntry,
  };
};