/**
 * Auth Store — аутентификация и управление пользователем.
 */
import { useCallback, useEffect, useState } from "react";
import { api, setToken, getToken } from "../lib/api";
import type { User } from "../lib/api";

export function useAuthStore() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Загрузить профиль по существующему токену. */
  const loadUser = useCallback(async () => {
    const saved = getToken();
    if (!saved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await api.auth.me();
      setUser(me);
      setTokenState(saved);
      setError(null);
    } catch {
      // Токен невалиден — очищаем
      setToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Войти. */
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      setToken(res.access_token);
      setTokenState(res.access_token);
      const me = await api.auth.me();
      setUser(me);
    } catch (e: any) {
      setError(e.message || "Ошибка входа");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Зарегистрироваться. */
  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(email, password, name);
      setToken(res.access_token);
      setTokenState(res.access_token);
      const me = await api.auth.me();
      setUser(me);
    } catch (e: any) {
      setError(e.message || "Ошибка регистрации");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Выйти. */
  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setError(null);
  }, []);

  // При первом рендере — проверяем сохранённый токен
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return { user, token, loading, error, login, register, logout, loadUser };
}
