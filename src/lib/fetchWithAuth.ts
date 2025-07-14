// src/lib/fetchWithAuth.ts
import { getCookie, setCookie } from './cookieHelper';

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<Response> => {
  const accessToken = getCookie('access_token');

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // ضروري لإرسال الكوكي
  });

  if (res.status === 401 && retry) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await refreshRes.json();

    if (data.access_token) {
      setCookie('access_token', data.access_token, 15 * 60); // 15 دقيقة
      return fetchWithAuth(url, options, false);
    }
  }

  return res;
};
