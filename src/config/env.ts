import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:5000/api/v1'),
  VITE_SOCKET_URL: z.string().url().default('http://localhost:5000'),
  VITE_SUPABASE_URL: z.string().url().default('https://yxlijrdavohgigtlbmpl.supabase.co'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).default('sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76'),
});

const parseEnv = () => {
  const rawEnv = {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://yxlijrdavohgigtlbmpl.supabase.co',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76',
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    // Fall back to defaults to avoid breaking the UI rendering
    return {
      VITE_API_URL: 'http://localhost:5000/api/v1',
      VITE_SOCKET_URL: 'http://localhost:5000',
      VITE_SUPABASE_URL: 'https://yxlijrdavohgigtlbmpl.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76',
    };
  }

  return result.data;
};

export const env = parseEnv();
