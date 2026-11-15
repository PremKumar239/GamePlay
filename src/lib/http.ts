export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: isForm ? init.headers : { 'content-type': 'application/json', ...init.headers },
  });
  const data = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
