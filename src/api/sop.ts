const LMS_URL = import.meta.env.VITE_LMS_URL || 'http://38.180.229.254:8000';

// ── Types matching the backend schema ─────────────────────────────────────

export interface SOPListItem {
  id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  steps_count: number;
  is_completed: boolean;
}

export interface SOPStep {
  step_number: number;
  title: string;
  content: string;
  image_url?: string | null;
}

/** Backend quiz format: correct_answer is a letter "A"–"D", not an index */
export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;   // "A", "B", "C", "D"
  explanation: string;
}

export interface SOPWithSteps {
  id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  steps: SOPStep[];
  quiz_json: QuizQuestion[] | null;   // raw list, NOT {questions: [...]}
  created_at: string | null;
}

export interface OrgProgress {
  org_name: string;
  sops: { id: number; title: string }[];
  members: {
    user_key: string;
    is_manager: boolean;
    sops: {
      sop_id: number;
      sop_title: string;
      completed: boolean;
      score: number | null;
      max_score: number | null;
      completed_at: string | null;
    }[];
  }[];
}

// ── API functions ──────────────────────────────────────────────────────────

export async function fetchSOPs(orgId: number, userKey: string): Promise<SOPListItem[]> {
  const params = new URLSearchParams({ user_key: userKey });
  const res = await fetch(`${LMS_URL}/api/orgs/${orgId}/sops?${params}`);
  if (!res.ok) throw new Error('Не удалось загрузить список регламентов');
  return res.json();
}

export async function fetchSOP(sopId: number): Promise<SOPWithSteps> {
  const res = await fetch(`${LMS_URL}/api/sops/${sopId}`);
  if (!res.ok) throw new Error('Не удалось загрузить регламент');
  return res.json();
}

export async function completeSOP(
  sopId: number,
  data: { user_key: string; score: number; max_score: number; time_spent_sec: number },
): Promise<void> {
  const params = new URLSearchParams({
    user_key: data.user_key,
    score: String(data.score),
    max_score: String(data.max_score),
    time_spent_sec: String(data.time_spent_sec),
  });
  const res = await fetch(`${LMS_URL}/api/sops/${sopId}/complete?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error('Не удалось сохранить прохождение');
}

export async function fetchOrgProgress(orgId: number, userKey: string): Promise<OrgProgress> {
  const params = new URLSearchParams({ user_key: userKey });
  const res = await fetch(`${LMS_URL}/api/orgs/${orgId}/sop-progress?${params}`);
  if (!res.ok) throw new Error('Не удалось загрузить прогресс');
  return res.json();
}

export async function uploadSOPPdf(
  orgId: number,
  file: File,
  userKey: string,
  title?: string,
): Promise<{ status: string; sop_id: number; steps_count: number; quiz_count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_key', userKey);
  if (title) formData.append('title', title);

  const res = await fetch(`${LMS_URL}/api/orgs/${orgId}/sops/upload-pdf`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Не удалось загрузить PDF');
  return res.json();
}
