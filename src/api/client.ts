import { ENV } from '@/config/env';
import { supabase } from '@/lib/supabase';

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `${ENV.API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
  };

  // FormData일 때는 Content-Type을 설정하지 않음 (브라우저/RN이 자동으로 boundary 포함)
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
}
