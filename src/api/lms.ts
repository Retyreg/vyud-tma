const LMS_URL = import.meta.env.VITE_LMS_URL || 'http://38.180.229.254:8000';

export interface LmsOrg {
  org_id: number;
  org_name: string;
  invite_code: string;
  is_manager: boolean;
}

export interface LmsNode {
  id: number;
  label: string;
  level: number;
  is_completed: boolean;
  is_available: boolean;
}

export interface LmsEdge {
  source: number;
  target: number;
}

export interface LmsGraph {
  nodes: LmsNode[];
  edges: LmsEdge[];
}

function lmsHeaders(): Record<string, string> {
  const initData =
    typeof window !== 'undefined'
      ? (window as any).Telegram?.WebApp?.initData ?? ''
      : '';
  return { 'Content-Type': 'application/json', 'X-Init-Data': initData };
}

export async function createOrg(
  name: string,
  managerKey: string,
): Promise<{ org_id: number; org_name: string; invite_code: string }> {
  const res = await fetch(`${LMS_URL}/api/orgs`, {
    method: 'POST',
    headers: lmsHeaders(),
    body: JSON.stringify({ name, manager_key: managerKey }),
  });
  if (!res.ok) throw new Error('Не удалось создать организацию');
  return res.json();
}

export async function getUserOrgs(userKey: string): Promise<LmsOrg[]> {
  const res = await fetch(`${LMS_URL}/api/users/${encodeURIComponent(userKey)}/orgs`, {
    headers: lmsHeaders(),
  });
  if (!res.ok) throw new Error('Не удалось загрузить организации');
  return res.json();
}

export async function joinOrg(
  inviteCode: string,
  userKey: string,
  displayName?: string,
): Promise<{ org_id: number; org_name: string }> {
  const res = await fetch(
    `${LMS_URL}/api/orgs/join?invite_code=${encodeURIComponent(inviteCode)}`,
    {
      method: 'POST',
      headers: lmsHeaders(),
      body: JSON.stringify({ user_key: userKey, display_name: displayName ?? null }),
    },
  );
  if (!res.ok) throw new Error('Неверный код приглашения');
  return res.json();
}

export async function getOrgGraph(orgId: number): Promise<LmsGraph> {
  const res = await fetch(`${LMS_URL}/api/orgs/${orgId}/courses/latest`, {
    headers: lmsHeaders(),
  });
  if (!res.ok) throw new Error('Не удалось загрузить граф');
  return res.json();
}

/**
 * Opens an SSE connection to stream a node explanation.
 * Returns a cleanup function that closes the connection.
 */
export function streamNodeExplanation(
  nodeId: number,
  onChunk: (text: string, cached: boolean) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): () => void {
  const es = new EventSource(`${LMS_URL}/api/explain-stream/${nodeId}`);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.error) {
        onError(data.error);
        es.close();
        return;
      }
      if (data.text !== undefined) {
        onChunk(data.text, !!data.cached);
      }
      if (data.done) {
        onDone();
        es.close();
      }
    } catch {
      // ignore malformed lines
    }
  };

  es.onerror = () => {
    onError('Ошибка соединения');
    es.close();
  };

  return () => es.close();
}
