import api, { setAccessToken } from "../api";
import { useState, useEffect } from "react";

export const authClient = {
  signIn: {
    email: async ({ email, password }: Record<string, string>, options?: { onSuccess?: (data: unknown) => void, onError?: (err: unknown) => void }) => {
      try {
        const { data } = await api.post('/auth/login', { email, senha: password });
        setAccessToken(data.accessToken);
        options?.onSuccess?.(data);
        return { data };
      } catch (error: unknown) {
        options?.onError?.({ error: (error as { response?: { data?: unknown } }).response?.data || error });
        throw error;
      }
    }
  },
  signOut: async (options?: { fetchOptions?: { onSuccess?: () => void, onError?: (err: unknown) => void } }) => {
    try {
      await api.post('/auth/logout');
      setAccessToken(null);
      options?.fetchOptions?.onSuccess?.();
    } catch (error: unknown) {
      options?.fetchOptions?.onError?.(error);
      throw error;
    }
  },
  resetPassword: async ({ newPassword, token }: Record<string, string>, options?: { onSuccess?: (data: unknown) => void, onError?: (err: { error: { message: string } }) => void }) => {
      try {
          const { data } = await api.post('/auth/definir-senha', { token, novaSenha: newPassword });
          options?.onSuccess?.(data);
          return { data };
      } catch (error: unknown) {
          const axiosError = error as { response?: { data?: { error?: { message?: string } } }, message?: string };
          const errorMsg = axiosError.response?.data?.error?.message || axiosError.message || "Erro desconhecido";
          options?.onError?.({ error: { message: errorMsg } });
          throw error;
      }
  }
};

// Custom hook to replace better-auth useSession
export function useSession() {
  const [data, setData] = useState<{ user: { id: string, name: string | null, email: string | null } } | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        // This will trigger the refresh interceptor if accessToken is missing/expired
        // but refreshToken cookie is present.
        const { data } = await api.get('/auth/me'); 
        setData({ user: data.user });
      } catch (err) {
        setError(err);
      } finally {
        setIsPending(false);
      }
    }
    fetchSession();
  }, []);

  return { data, isPending, error };
}

export const { signIn, signOut } = authClient;
