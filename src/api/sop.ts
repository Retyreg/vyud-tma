import { getAuthHeaders, getAuthHeadersMultipart } from './client';

const LMS_URL = import.meta.env.VITE_LMS_URL || 'http://38.180.229.254:8000';

// ── Types ──────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface QuizJson {
  questions: QuizQuestion[];
}

export interface SOP {
  id: number;
  org_id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  created_by: string;
  quiz_json: QuizJson | null;
  created_at: string;
}

export interface SOPStep {
  id: number;
  sop_id: number;
  step_number: number;
  title: string;
  content: string;
  image_url: string | null;
}

export interface SOPWithSteps extends SOP {
  steps: SOPStep[];
}

export interface SOPCompletion {
  id: number;
  sop_id: number;
  user_key: string;
  score: number;
  max_score: number;
  completed_at: string;
  time_spent_sec: number;
}

export interface CompletionData {
  user_key: string;
  score: number;
  max_score: number;
  time_spent_sec: number;
}

// ── API functions ──────────────────────────────────────────────────────────

export async function fetchSOPs(orgId: number): Promise<SOP[]> {
  const res = await fetch(`${LMS_URL}/api/v1/orgs/${orgId}/sops`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Не удалось загрузить список регламентов');
  return res.json();
}

export async function fetchSOP(sopId: number): Promise<SOPWithSteps> {
  const res = await fetch(`${LMS_URL}/api/v1/sops/${sopId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Не удалось загрузить регламент');
  return res.json();
}

export async function completeSOP(sopId: number, data: CompletionData): Promise<void> {
  const res = await fetch(`${LMS_URL}/api/v1/sops/${sopId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Не удалось сохранить прохождение');
}

export async function fetchSOPProgress(sopId: number): Promise<SOPCompletion[]> {
  const res = await fetch(`${LMS_URL}/api/v1/sops/${sopId}/progress`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Не удалось загрузить прогресс');
  return res.json();
}

export async function uploadSOPPdf(orgId: number, file: File): Promise<SOP> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${LMS_URL}/api/v1/orgs/${orgId}/sops/upload-pdf`, {
    method: 'POST',
    headers: getAuthHeadersMultipart(),
    body: formData,
  });
  if (!res.ok) throw new Error('Не удалось загрузить PDF');
  return res.json();
}
