import { supabase } from './supabase';

export interface NetworkTestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
}

const SUPABASE_URL = 'https://uavoefrjobxbyshiftwul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdm9lZnJqb3hiZnlzaWZ0d3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjc3NzUsImV4cCI6MjA4OTUwMzc3NX0.K-9Uu5e8VkSjuQe4f32GNtYcCFsqp3asmHugMMf1FiE';

/**
 * Test Supabase connectivity with multiple checks
 */
export async function testSupabaseConnection(): Promise<NetworkTestResult[]> {
  const results: NetworkTestResult[] = [];

  // Test 1: Basic HTTP connectivity
  try {
    const start = Date.now();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact',
      },
    });
    const duration = Date.now() - start;
    
    if (response.ok) {
      results.push({
        name: 'HTTP Connectivity',
        success: true,
        message: `Status: ${response.status} (${duration}ms)`,
        duration,
      });
    } else {
      results.push({
        name: 'HTTP Connectivity',
        success: false,
        message: `Status: ${response.status}`,
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'HTTP Connectivity',
      success: false,
      message: error.message || 'Network error',
    });
  }

  // Test 2: Auth endpoint
  try {
    const start = Date.now();
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      results.push({
        name: 'Auth Endpoint',
        success: true,
        message: `External auth: ${data.external?.length || 0} providers (${duration}ms)`,
        duration,
      });
    } else {
      results.push({
        name: 'Auth Endpoint',
        success: false,
        message: `Status: ${response.status}`,
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Auth Endpoint',
      success: false,
      message: error.message || 'Network error',
    });
  }

  // Test 3: Supabase client health check
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('_nonexistent_table').select('*').limit(1);
    const duration = Date.now() - start;
    
    // Even if table doesn't exist, if we get a proper error, connection works
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        results.push({
          name: 'Supabase Client',
          success: true,
          message: `Client connected (${duration}ms)`,
          duration,
        });
      } else {
        results.push({
          name: 'Supabase Client',
          success: false,
          message: error.message,
          duration,
        });
      }
    } else {
      results.push({
        name: 'Supabase Client',
        success: true,
        message: `Query succeeded (${duration}ms)`,
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Supabase Client',
      success: false,
      message: error.message || 'Unknown error',
    });
  }

  // Test 4: DNS resolution (via fetch to a known endpoint)
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const duration = Date.now() - start;
    
    results.push({
      name: 'Internet Connectivity',
      success: true,
      message: `Google reachable (${duration}ms)`,
      duration,
    });
  } catch (error: any) {
    results.push({
      name: 'Internet Connectivity',
      success: false,
      message: error.name === 'AbortError' ? 'Timeout (5s)' : error.message,
    });
  }

  return results;
}

/**
 * Quick connectivity check (for auth flows)
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}
