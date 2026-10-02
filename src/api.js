export async function api(path, { body, signal, method = 'GET' } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, { method, signal, headers: body ? { 'Content-Type': 'application/json' } : {}, ...(body ? { body: JSON.stringify(body) } : {}) });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해 주세요.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `요청을 처리하지 못했습니다. (HTTP ${response.status})`);
  if (data == null) throw new Error('서버 응답을 확인할 수 없습니다. API 연결 설정을 확인해 주세요.');
  return data;
}
