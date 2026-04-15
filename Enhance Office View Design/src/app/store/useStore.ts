/**
 * Store — глобальное состояние приложения.
 * Минималистичный стор на React hooks (без Zustand/Redux).
 */
import { useCallback, useEffect, useState } from "react";
import { api, Agent, Goal, Task, Message, GoalStatus } from "../lib/api";

// ====== Agent Store ======
export function useAgentStore() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.agents.list();
      setAgents(data);
    } catch (e) {
      console.error("Failed to fetch agents:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAgent = useCallback(async (data: Parameters<typeof api.agents.create>[0]) => {
    const agent = await api.agents.create(data);
    setAgents((prev) => [...prev, agent]);
    return agent;
  }, []);

  const removeAgent = useCallback(async (id: string) => {
    await api.agents.delete(id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAgentStatus = useCallback((agentId: string, status: Agent["status"]) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status } : a))
    );
  }, []);

  return { agents, loading, fetchAgents, addAgent, removeAgent, updateAgentStatus, setAgents };
}

// ====== Goal Store ======
export function useGoalStore() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.goals.list();
      setGoals(data);
      if (data.length > 0 && !activeGoal) {
        setActiveGoal(data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch goals:", e);
    } finally {
      setLoading(false);
    }
  }, [activeGoal]);

  const createGoal = useCallback(async (data: Parameters<typeof api.goals.create>[0]) => {
    const goal = await api.goals.create(data);
    setGoals((prev) => [goal, ...prev]);
    setActiveGoal(goal);
    return goal;
  }, []);

  return { goals, activeGoal, loading, fetchGoals, createGoal, setActiveGoal };
}

// ====== Task Store ======
export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (goalId: string) => {
    setLoading(true);
    try {
      const data = await api.tasks.list(goalId);
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  }, []);

  return { tasks, loading, fetchTasks, updateTask, setTasks };
}

// ====== Message Store ======
export function useMessageStore() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async (goalId: string) => {
    setLoading(true);
    try {
      const data = await api.messages.list(goalId);
      setMessages(data);
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const appendToMessage = useCallback((id: string, chunk: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: (m.content || "") + chunk } : m)));
  }, []);

  return { messages, loading, fetchMessages, addMessage, updateMessage, appendToMessage, setMessages };
}

// ====== Status Store ======
export function useStatusStore() {
  const [status, setStatus] = useState<GoalStatus | null>(null);

  const fetchStatus = useCallback(async (goalId: string) => {
    try {
      const data = await api.orchestration.status(goalId);
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch status:", e);
    }
  }, []);

  return { status, fetchStatus, setStatus };
}
