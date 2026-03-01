import { supabase } from '@/lib/supabase';
import { ENV } from '@/config/env';

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `${ENV.API_BASE_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...options?.headers,
    },
  });
}
