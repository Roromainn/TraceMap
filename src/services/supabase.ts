import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Supabase Cloud URL
const SUPABASE_URL = ' https://uavoefrjoxbfysiftwul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdm9lZnJqb3hiZnlzaWZ0d3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjc3NzUsImV4cCI6MjA4OTUwMzc3NX0.K-9Uu5e8VkSjuQe4f32GNtYcCFsqp3asmHugMMf1FiE';

// Custom storage using Expo SecureStore (tokens chiffrés sur l'appareil)
const expoStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: expoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
