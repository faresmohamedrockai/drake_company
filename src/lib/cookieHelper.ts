// src/lib/cookieHelpers.ts

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function setCookie(name: string, value: string, seconds: number) {
  const expires = new Date(Date.now() + seconds * 1000).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}`;
}
