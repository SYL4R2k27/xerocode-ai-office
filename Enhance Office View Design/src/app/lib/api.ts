/**
 * API Client — общение с бэкендом AI Office.
 */

const API_BASE = import.meta.env.DEV
  ? "http://localhost:8000/api"
  : `${window.location.origin}/api`;

/** Читает JWT-токен из localStorage. */
export function getToken(): string | null {
  return localStorage.getItem("ai_office_token");
}

/** Сохраняет JWT-токен в localStorage. */
export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem("ai_office_token", token);
  } else {
    localStorage.removeItem("ai_office_token");
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

/** Request без Content-Type (для FormData). */
async function requestRaw<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ====== Types ======

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  tasks_used_this_month: number;
  created_at: string;
  avatar?: string;
  is_admin?: boolean;
  // Corporate fields
  organization_id?: string;
  organization_name?: string;
  org_role?: "owner" | "manager" | "member";
  // Professional role
  professional_role?: string;
  professional_role_label?: string;
  permissions?: string[];
  modules?: string[];
}

export type ProfessionalRole = "director" | "chief_accountant" | "accountant" | "sales_manager" | "project_manager" | "logistics" | "hr_manager" | "legal" | "marketer" | "operator";

export interface RoleInfo {
  id: ProfessionalRole;
  label: string;
  permissions_count: number;
  modules: string[];
}

export interface CRMContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  notes: string | null;
  created_at: string;
}

export interface CRMDeal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stage: string;
  contact_id: string | null;
  assignee_id: string | null;
  description: string | null;
  contact_name?: string | null;
  assignee_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStats {
  stages: Record<string, { count: number; total_amount: number; label: string }>;
}

export interface Org {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  member_count: number;
}

export interface OrgMember {
  id: string;
  email: string;
  name: string;
  org_role: "owner" | "manager" | "member" | null;
  tasks_used_this_month: number;
  created_at: string | null;
}

export interface OrgStats {
  total_members: number;
  total_goals: number;
  active_projects: number;
  total_tasks: number;
  tasks_done: number;
  tasks_in_progress: number;
  tasks_pending: number;
  tasks_backlog: number;
  tasks_review_operator: number;
  tasks_review_manager: number;
  completed_this_week: number;
  total_cost_usd: number;
}

export interface OrgActivity {
  id: string;
  user_name: string;
  action: string;
  target: string;
  details?: Record<string, any>;
  created_at: string | null;
}

export interface OrgTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: number;
  goal_id: string;
  goal_title: string | null;
  assigned_agent_id: string | null;
  agent_name: string | null;
  created_by_ai: boolean;
  operator_id: string | null;
  operator_name: string | null;
  reviewer_id: string | null;
  ai_result: string | null;
  review_comment: string | null;
  operator_approved_at: string | null;
  manager_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  agents_config: any[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Pool {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  category: string;
  agents: Array<{
    name: string;
    role: string;
    avatar: string;
    provider: string;
    model_name: string;
    skills: string[];
  }>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  provider: string;
  model_name: string;
  base_url: string | null;
  skills: string[] | null;
  status: "idle" | "thinking" | "working" | "completed" | "error";
  is_active: boolean;
  total_tokens_used: number;
  total_cost_usd: number;
  created_at: string;
}

export interface AgentCreate {
  name: string;
  role: string;
  avatar?: string;
  provider: "openai" | "anthropic" | "ollama" | "custom";
  model_name: string;
  api_key?: string;
  base_url?: string;
  skills?: string[];
  system_prompt?: string;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "paused" | "completed" | "failed";
  distribution_mode: "manager" | "discussion" | "auto";
  economy_mode: boolean;
  max_exchanges: number | null;
  output_folder: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalCreate {
  title: string;
  description?: string;
  distribution_mode?: "manager" | "discussion" | "auto";
  economy_mode?: boolean;
  max_exchanges?: number;
  output_folder?: string;
}

export interface Task {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: "pending" | "assigned" | "in_progress" | "done" | "failed" | "backlog" | "review_operator" | "review_manager";
  priority: number;
  assigned_agent_id: string | null;
  depends_on: string[] | null;
  result: string | null;
  result_files: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  goal_id: string;
  sender_type: "user" | "agent" | "system";
  sender_agent_id: string | null;
  sender_name: string;
  content: string;
  message_type: string;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

export interface GoalStatus {
  goal_id: string;
  tasks: Record<string, number>;
  cost: {
    total_cost_usd: number;
    total_tokens: number;
    message_count: number;
    exchange_count: number;
    cost_by_agent: Record<string, number>;
    limit_reached: boolean;
    remaining_exchanges: number | null;
    economy_mode: boolean;
  };
  agents: Array<{
    id: string;
    name: string;
    status: string;
    cost_usd: number;
  }>;
  ws_connections: number;
}

// ====== API Functions ======

export const api = {
  // Auth
  auth: {
    register: (email: string, password: string, name: string, invite_code?: string) =>
      request<TokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name, invite_code: invite_code || "" }),
      }),
    login: (email: string, password: string) =>
      request<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/auth/me"),
    updateProfile: (name: string, avatar?: string) =>
      request<User>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, ...(avatar !== undefined ? { avatar } : {}) }),
      }),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      }),
    deleteAccount: () =>
      request<void>("/auth/account", { method: "DELETE" }),
  },

  // Pools
  pools: {
    list: (tier?: string) => {
      const q = tier ? `?tier=${tier}` : "";
      return request<Pool[]>(`/agents/pools/${q}`);
    },
    activate: (poolId: string) =>
      request<Agent[]>(`/agents/pools/${poolId}/activate`, { method: "POST" }),
  },

  // Custom Pools (user-created)
  customPools: {
    list: () => request<any[]>("/custom-pools/"),
    create: (data: { name: string; description: string; category: string; agents_config: any[] }) =>
      request<any>("/custom-pools/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/custom-pools/${id}`, { method: "DELETE" }),
    activate: (id: string) => request<any>(`/custom-pools/${id}/activate`, { method: "POST" }),
  },

  // Files
  files: {
    upload: (goalId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return requestRaw<{ filename: string; size: number; goal_id: string; path: string }>(
        `/files/upload?goal_id=${goalId}`,
        { method: "POST", body: formData }
      );
    },
    list: (goalId: string) =>
      request<{ files: Array<{ name: string; size: number; modified: number }>; goal_id: string }>(
        `/files/${goalId}`
      ),
    download: (goalId: string, filename: string) =>
      `${API_BASE}/files/${goalId}/${filename}`,
  },

  // Agents
  agents: {
    list: (params?: { provider?: string; is_active?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.provider) q.set("provider", params.provider);
      if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
      return request<Agent[]>(`/agents/?${q}`);
    },
    get: (id: string) => request<Agent>(`/agents/${id}`),
    create: (data: AgentCreate) =>
      request<Agent>("/agents/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<AgentCreate>) =>
      request<Agent>(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/agents/${id}`, { method: "DELETE" }),
    test: (id: string) =>
      request<{ status: string; message: string }>(`/agents/${id}/test`, { method: "POST" }),
  },

  // Goals
  goals: {
    list: (status?: string) => {
      const q = status ? `?status=${status}` : "";
      return request<Goal[]>(`/goals/${q}`);
    },
    get: (id: string) => request<Goal>(`/goals/${id}`),
    create: (data: GoalCreate) =>
      request<Goal>("/goals/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Goal>) =>
      request<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/goals/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    list: (goalId?: string) => {
      const q = goalId ? `?goal_id=${goalId}` : "";
      return request<Task[]>(`/tasks/${q}`);
    },
    get: (id: string) => request<Task>(`/tasks/${id}`),
    update: (id: string, data: Partial<Task>) =>
      request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    review: (taskId: string, action: string, comment?: string) =>
      request(`/tasks/${taskId}/review`, {
        method: "POST",
        body: JSON.stringify({ action, comment }),
      }),
  },

  // Messages
  messages: {
    list: (goalId: string, limit = 50) =>
      request<Message[]>(`/messages/?goal_id=${goalId}&limit=${limit}`),
  },

  // Orchestration
  orchestration: {
    start: (goalId: string) =>
      request<any>(`/orchestration/start/${goalId}`, { method: "POST" }),
    resume: (goalId: string) =>
      request<any>(`/orchestration/resume/${goalId}`, { method: "POST" }),
    userInput: (goalId: string, content: string, inputType: "command" | "edit" | "idea") =>
      request<any>("/orchestration/user-input", {
        method: "POST",
        body: JSON.stringify({ goal_id: goalId, content, input_type: inputType }),
      }),
    status: (goalId: string) =>
      request<GoalStatus>(`/orchestration/status/${goalId}`),
  },

  // Organization
  org: {
    getMyOrg: () => request<Org>("/org/me"),
    getMembers: () => request<OrgMember[]>("/org/members"),
    invite: (email: string, role: string) =>
      request("/org/invite", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }),
    changeRole: (userId: string, role: string) =>
      request(`/org/members/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    removeMember: (userId: string) =>
      request(`/org/members/${userId}`, { method: "DELETE" }),
    getStats: () => request<OrgStats>("/org/stats"),
    getActivity: (limit = 50) => request<OrgActivity[]>(`/org/activity?limit=${limit}`),
    getTasks: (status?: string) => {
      const q = status ? `?status=${status}` : "";
      return request<OrgTask[]>(`/org/tasks${q}`);
    },
    transitionTask: (taskId: string, status: string, comment?: string) =>
      request(`/org/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, comment }),
      }),
  },

  // CRM
  crm: {
    contacts: {
      list: (search?: string) => request<CRMContact[]>(`/crm/contacts${search ? `?search=${encodeURIComponent(search)}` : ""}`),
      create: (data: { name: string; email?: string; phone?: string; company?: string; position?: string; notes?: string }) =>
        request<CRMContact>("/crm/contacts", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: string) => request(`/crm/contacts/${id}`, { method: "DELETE" }),
    },
    deals: {
      list: (stage?: string) => request<CRMDeal[]>(`/crm/deals${stage ? `?stage=${stage}` : ""}`),
      create: (data: { title: string; amount?: number; stage?: string; contact_id?: string; description?: string }) =>
        request<CRMDeal>("/crm/deals", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: Record<string, any>) =>
        request(`/crm/deals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: string) => request(`/crm/deals/${id}`, { method: "DELETE" }),
    },
    pipeline: () => request<PipelineStats>("/crm/pipeline"),
  },

  // Roles
  roles: {
    list: () => request<RoleInfo[]>("/org/roles"),
    setProfessionalRole: (userId: string, role: string) =>
      request(`/org/members/${userId}/professional-role`, {
        method: "PATCH",
        body: JSON.stringify({ professional_role: role }),
      }),
  },

  // Autoprompt
  autoprompt: {
    enhance: (text: string, category: string) =>
      request<{ enhanced: string }>("/autoprompt/enhance", {
        method: "POST",
        body: JSON.stringify({ text, category }),
      }),
  },

  // Templates
  templates: {
    list: () => request<Template[]>("/templates/"),
    create: (data: { name: string; description: string; category: string; agents_config: any[] }) =>
      request<Template>("/templates/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    use: (id: string) =>
      request(`/templates/${id}/use`, { method: "POST" }),
  },

  // Workflows
  workflows: {
    list: () => request<WorkflowData[]>("/workflows/"),
    templates: () => request<WorkflowTemplate[]>("/workflows/templates"),
    get: (id: string) => request<WorkflowData>(`/workflows/${id}`),
    create: (data: { name: string; description?: string; steps: any[]; category?: string }) =>
      request<WorkflowData>("/workflows/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; description?: string; steps?: any[]; category?: string }) =>
      request<WorkflowData>(`/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/workflows/${id}`, { method: "DELETE" }),
    run: (id: string) => request<{ goal_id: string; tasks_created: number; message: string }>(`/workflows/${id}/run`, { method: "POST" }),
  },
};

// Workflow types
export interface WorkflowStep {
  id: string;
  title: string;
  prompt: string;
  model: string;
  task_type: string;
  depends_on: string[];
  x: number;
  y: number;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  organization_id: string | null;
  steps: WorkflowStep[];
  is_template: boolean;
  category: string | null;
  run_count: number;
  last_run_goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  is_template: boolean;
  steps: WorkflowStep[];
}
