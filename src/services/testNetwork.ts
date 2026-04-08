import { supabase } from './supabase';

export interface NetworkTestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
}

export async function testSupabaseConnection(): Promise<NetworkTestResult[]> {
  const results: NetworkTestResult[] = [];

  // Test 1: Internet Connectivity
  const internetStart = Date.now();
  try {
    const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
    const internetDuration = Date.now() - internetStart;
    results.push({
      name: 'Internet Connectivity',
      success: true,
      message: 'Internet connection is working',
      duration: internetDuration,
    });
  } catch (error: any) {
    const internetDuration = Date.now() - internetStart;
    results.push({
      name: 'Internet Connectivity',
      success: false,
      message: `No internet connection: ${error.message}`,
      duration: internetDuration,
    });
  }

  // Test 2: Supabase URL
  const urlStart = Date.now();
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      results.push({
        name: 'Supabase URL',
        success: false,
        message: 'EXPO_PUBLIC_SUPABASE_URL not configured in .env',
      });
    } else {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'HEAD' });
      const urlDuration = Date.now() - urlStart;
      results.push({
        name: 'Supabase URL',
        success: response.ok || response.status === 401, // 401 is expected without auth
        message: response.ok ? 'Supabase URL is accessible' : `Supabase URL responded with status ${response.status}`,
        duration: urlDuration,
      });
    }
  } catch (error: any) {
    const urlDuration = Date.now() - urlStart;
    results.push({
      name: 'Supabase URL',
      success: false,
      message: `Cannot reach Supabase URL: ${error.message}`,
      duration: urlDuration,
    });
  }

  // Test 3: Supabase Authentication
  const authStart = Date.now();
  try {
    const { data, error } = await supabase.auth.getSession();
    const authDuration = Date.now() - authStart;
    
    if (error) {
      results.push({
        name: 'Supabase Auth',
        success: false,
        message: `Auth error: ${error.message}`,
        duration: authDuration,
      });
    } else {
      results.push({
        name: 'Supabase Auth',
        success: !!data.session,
        message: data.session ? `Authenticated as ${data.session.user.email}` : 'No active session',
        duration: authDuration,
      });
    }
  } catch (error: any) {
    const authDuration = Date.now() - authStart;
    results.push({
      name: 'Supabase Auth',
      success: false,
      message: `Auth failed: ${error.message}`,
      duration: authDuration,
    });
  }

  // Test 4: Supabase Database Connection
  const dbStart = Date.now();
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    const dbDuration = Date.now() - dbStart;
    
    if (error) {
      results.push({
        name: 'Supabase Database',
        success: false,
        message: `Database error: ${error.message}`,
        duration: dbDuration,
      });
    } else {
      results.push({
        name: 'Supabase Database',
        success: true,
        message: 'Database connection successful',
        duration: dbDuration,
      });
    }
  } catch (error: any) {
    const dbDuration = Date.now() - dbStart;
    results.push({
      name: 'Supabase Database',
      success: false,
      message: `Database failed: ${error.message}`,
      duration: dbDuration,
    });
  }

  return results;
}
