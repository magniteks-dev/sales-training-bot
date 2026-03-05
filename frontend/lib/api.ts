const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// Auth
export const api = {
  auth: {
    telegramLogin: (initData: string) =>
      request<{ access_token: string; user_id: string; role: string }>("/api/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ init_data: initData }),
      }),
    adminLogin: (password: string) =>
      request<{ access_token: string; user_id: string; role: string }>("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      }),
    me: () => request<{ id: string; role: string; first_name: string; telegram_id?: number; last_name?: string; username?: string }>("/api/auth/me"),
  },

  training: {
    getModules: () => request<Module[]>("/api/training/modules"),
    getModule: (id: string) => request<Module>(`/api/training/modules/${id}`),
    getMaterials: (moduleId: string) => request<Material[]>(`/api/training/modules/${moduleId}/materials`),
    getChatHistory: (moduleId: string) => request<{ messages: ChatMessage[] }>(`/api/training/modules/${moduleId}/chat-history`),
  },

  chat: {
    sendMessage: (moduleId: string, message: string) =>
      request<{ reply: string; module_completed: boolean }>("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({ module_id: moduleId, message }),
      }),
  },

  roleplay: {
    getScenarios: () => request<RoleplayScenario[]>("/api/roleplay/scenarios"),
    startSession: (scenarioId: string) =>
      request<{ session_id: string; scenario: RoleplayScenario; opening_message: string }>("/api/roleplay/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId }),
      }),
    sendMessage: (sessionId: string, message: string) =>
      request<{ reply: string; session_ended: boolean }>("/api/roleplay/message", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, message }),
      }),
    endSession: (sessionId: string) =>
      request<RoleplayFeedback>("/api/roleplay/end", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      }),
  },

  voice: {
    startSession: (scenarioId: string) =>
      request<{ session_id: string; signed_url: string; scenario: RoleplayScenario }>("/api/voice/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId }),
      }),
    endSession: (sessionId: string, transcript: string) =>
      request<{ score: number; feedback: string; transcript: string }>("/api/voice/end", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, transcript }),
      }),
    getSessions: () => request<VoiceSession[]>("/api/voice/sessions"),
  },

  exam: {
    getQuestions: () => request<{ questions: ExamQuestion[]; total: number }>("/api/exam/questions"),
    submit: (answers: { question_id: string; answer: string }[]) =>
      request<ExamResult>("/api/exam/submit", {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    getAttempts: () => request<ExamAttempt[]>("/api/exam/my-attempts"),
  },

  progress: {
    getMyProgress: () => request<UserProgress>("/api/progress/me"),
  },

  admin: {
    getModules: () => request<Module[]>("/api/admin/modules"),
    createModule: (data: Partial<Module>) =>
      request<Module>("/api/admin/modules", { method: "POST", body: JSON.stringify(data) }),
    updateModule: (id: string, data: Partial<Module>) =>
      request<Module>(`/api/admin/modules/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteModule: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/modules/${id}`, { method: "DELETE" }),
    getMaterials: (moduleId: string) => request<Material[]>(`/api/admin/modules/${moduleId}/materials`),
    createMaterial: (data: Partial<Material>) =>
      request<Material>("/api/admin/materials", { method: "POST", body: JSON.stringify(data) }),
    deleteMaterial: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/materials/${id}`, { method: "DELETE" }),
    getQuestions: () => request<ExamQuestion[]>("/api/admin/exam-questions"),
    createQuestion: (data: Partial<ExamQuestion>) =>
      request<ExamQuestion>("/api/admin/exam-questions", { method: "POST", body: JSON.stringify(data) }),
    deleteQuestion: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/exam-questions/${id}`, { method: "DELETE" }),
    getScenarios: () => request<RoleplayScenario[]>("/api/admin/roleplay-scenarios"),
    createScenario: (data: Partial<RoleplayScenario>) =>
      request<RoleplayScenario>("/api/admin/roleplay-scenarios", { method: "POST", body: JSON.stringify(data) }),
    deleteScenario: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/roleplay-scenarios/${id}`, { method: "DELETE" }),
    getTrainees: () => request<TraineeInfo[]>("/api/admin/trainees"),
    getStats: () => request<AdminStats>("/api/admin/stats"),
    exportTrainees: () => `${BASE_URL}/api/admin/trainees/export`,
  },
};

// Types
export interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
  chat_completed?: boolean;
}

export interface Material {
  id: string;
  module_id: string;
  content_text: string;
  material_type: string;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  product_type: string;
  client_persona: string;
  difficulty: "easy" | "medium" | "hard";
  system_prompt?: string;
  created_at: string;
}

export interface RoleplayFeedback {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface VoiceSession {
  id: string;
  score?: number;
  status: string;
  created_at: string;
  roleplay_scenarios?: { title: string; product_type: string };
}

export interface ExamQuestion {
  id: string;
  module_id: string;
  question: string;
  question_type: "mcq" | "open";
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

export interface ExamResult {
  score: number;
  passed: boolean;
  total_questions: number;
  correct_answers: number;
  feedback: {
    question_id: string;
    question: string;
    is_correct: boolean;
    user_answer: string;
    correct_answer: string;
    explanation: string;
  }[];
  can_retry_at?: string;
}

export interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  created_at: string;
}

export interface UserProgress {
  user_id: string;
  modules: (Module & { chat_completed: boolean })[];
  completed_modules: number;
  total_modules: number;
  overall_completion: number;
  roleplay_sessions_count: number;
  voice_sessions_count: number;
  exam_passed: boolean;
  exam_score?: number;
}

export interface TraineeInfo {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  telegram_id: number;
  modules_completed: number;
  total_modules: number;
  exam_passed: boolean;
  exam_score?: number;
  roleplay_sessions: number;
  voice_sessions: number;
  created_at: string;
}

export interface AdminStats {
  total_trainees: number;
  passed_exam: number;
  total_roleplay_sessions: number;
  total_voice_sessions: number;
}
