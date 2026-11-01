import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:5000/api/v1'),
  VITE_SOCKET_URL: z.string().url().default('http://localhost:5000'),
  VITE_SUPABASE_URL: z.string().url().default('https://yxlijrdavohgigtlbmpl.supabase.co'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).default('sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76'),
});

const parseEnv = () => {
  const defaultApiUrl =
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3000/api/v1');

  const defaultSocketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const rawEnv = {
    VITE_API_URL: defaultApiUrl,
    VITE_SOCKET_URL: defaultSocketUrl,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://yxlijrdavohgigtlbmpl.supabase.co',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76',
  };

  return rawEnv;
};

export const env = parseEnv();
