
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SOCKET_URL: z.string().url(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

const parseEnv = () => {
  const rawEnv = {
    VITE_API_URL:
      import.meta.env.VITE_API_URL ||
      'https://project-match-t42v.onrender.com/api/v1',

    VITE_SOCKET_URL:
      import.meta.env.VITE_SOCKET_URL ||
      'https://project-match-t42v.onrender.com',

    VITE_SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL ||
      'https://yxlijrdavohgigtlbmpl.supabase.co',

    VITE_SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76',
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration. Please check your .env settings.');
  }

  return result.data;
};

export const env = parseEnv();
