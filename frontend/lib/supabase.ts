/**
 * Supabase Client Configuration
 * 
 * Provides type-safe Supabase clients for both client-side and server-side usage.
 * Includes proper error handling, connection pooling, and environment validation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase Database Schema Types
 * These should match your Prisma schema for type safety
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          emailVerified: boolean;
          passwordHash: string | null;
          name: string | null;
          image: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          email: string;
          emailVerified?: boolean;
          passwordHash?: string | null;
          name?: string | null;
          image?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          emailVerified?: boolean;
          passwordHash?: string | null;
          name?: string | null;
          image?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      events: {
        Row: {
          id: string;
          userId: string;
          filePath: string;
          eventType: string;
          tool: string | null;
          timestamp: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          userId: string;
          filePath: string;
          eventType: string;
          tool?: string | null;
          timestamp?: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          userId?: string;
          filePath?: string;
          eventType?: string;
          tool?: string | null;
          timestamp?: string;
          metadata?: Record<string, unknown> | null;
        };
      };
      patterns: {
        Row: {
          id: string;
          userId: string;
          fileExtension: string;
          count: number;
          lastUsed: string;
          tools: string[];
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          fileExtension: string;
          count?: number;
          lastUsed?: string;
          tools?: string[];
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          fileExtension?: string;
          count?: number;
          lastUsed?: string;
          tools?: string[];
          updatedAt?: string;
        };
      };
      // Add other tables as needed
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

/**
 * Client-side Supabase client (for use in React components, hooks, etc.)
 * Uses anonymous key - respects RLS policies
 */
let clientSupabase: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (clientSupabase) {
    return clientSupabase;
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    );
  }

  clientSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'floyo-web@1.0.0',
      },
    },
  });

  return clientSupabase;
}

/**
 * Server-side Supabase client (for use in API routes, server components)
 * Uses service role key - bypasses RLS (use with caution!)
 */
let serverSupabase: SupabaseClient<Database> | null = null;

export function getSupabaseServer(): SupabaseClient<Database> {
  if (serverSupabase) {
    return serverSupabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase server configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.'
    );
  }

  serverSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'floyo-server@1.0.0',
      },
    },
  });

  return serverSupabase;
}

/**
 * Admin Supabase client (for admin operations)
 * Uses service role key - use only in admin API routes
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  return getSupabaseServer();
}

/**
 * Helper to check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key);
  } catch {
    return false;
  }
}

/**
 * Helper to get Supabase URL
 */
export function getSupabaseUrl(): string {
  return env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Helper to get Supabase anon key
 */
export function getSupabaseAnonKey(): string {
  return env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Export default client for convenience
export const supabase = getSupabaseClient();
