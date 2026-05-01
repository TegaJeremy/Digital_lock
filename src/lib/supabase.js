import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const fetchEntries = async (userId) => {
  const { data, error } = await supabase
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const insertEntry = async (entry) => {
  const { data, error } = await supabase
    .from('vault_entries')
    .insert([entry])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEntry = async (id, updates) => {
  const { data, error } = await supabase
    .from('vault_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEntry = async (id) => {
  const { error } = await supabase
    .from('vault_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const cacheCredentials = (email, password) => {
  const data = JSON.stringify({ email, password });
  const encrypted = CryptoJS.AES.encrypt(data, 'tj_local_fallback_key').toString();
  localStorage.setItem('tj_vault_creds', encrypted);
};

export const getCachedCredentials = () => {
  try {
    const raw = localStorage.getItem('tj_vault_creds');
    if (!raw) return null;
    const bytes = CryptoJS.AES.decrypt(raw, 'tj_local_fallback_key');
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
};

const QUEUE_KEY = 'tj_sync_queue';

export const addToQueue = (action) => {
  const queue = getQueue();
  queue.push({ ...action, timestamp: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};

export const processQueue = async () => {
  const queue = getQueue();
  if (queue.length === 0) return;
  const failed = [];
  for (const action of queue) {
    try {
      if (action.type === 'insert') {
        await insertEntry(action.entry);
      } else if (action.type === 'update') {
        await updateEntry(action.id, action.entry);
      } else if (action.type === 'delete') {
        await deleteEntry(action.id);
      }
    } catch (e) {
      failed.push(action);
    }
  }
  if (failed.length === 0) {
    clearQueue();
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  }
};