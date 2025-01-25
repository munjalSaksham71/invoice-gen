'use client';
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (name: string) => {
          // Ensure this code only runs on the client
          if (typeof document !== "undefined") {
            const cookieStore = document.cookie
              .split("; ")
              .reduce((acc, cookie) => {
                const [key, value] = cookie.split("=");
                acc[key] = value;
                return acc;
              }, {} as Record<string, string>);
            return cookieStore[name];
          }
          return null;
        },
      setItem(name: string, value: string) {
        // Set the cookie
        const token = value;
        const cleanToken = token.replace(/^base64-/, ""); // Remove the prefix
        document.cookie = `${name}=${cleanToken}; path=/; secure; samesite=strict`;
      },
      removeItem(name: string) {
        // Remove the cookie
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  }
}
);

export default supabase;
