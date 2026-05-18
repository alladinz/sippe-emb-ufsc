import api, { setAccessToken } from "../api";
import { useState, useEffect } from "react";

export const authClient = {
  signIn: {
    email: async ({ email, password }: any, options?: any) => {
      try {
        const { data } = await api.post('/auth/login', { email, senha: password });
        setAccessToken(data.accessToken);
        options?.onSuccess?.(data);
        return { data };
      } catch (error: any) {
        options?.onError?.({ error: error.response?.data || error });
        throw error;
      }
    }
  },
  signOut: async (options?: any) => {
    try {
      await api.post('/auth/logout');
      setAccessToken(null);
      options?.fetchOptions?.onSuccess?.();
    } catch (error: any) {
      options?.fetchOptions?.onError?.(error);
      throw error;
    }
  },
  resetPassword: async ({ newPassword, token }: any, options?: any) => {
      try {
          const { data } = await api.post('/auth/definir-senha', { token, novaSenha: newPassword });
          options?.onSuccess?.(data);
          return { data };
      } catch (error: any) {
          options?.onError?.({ error: error.response?.data || error });
          throw error;
      }
  }
};

// Custom hook to replace better-auth useSession
export function useSession() {
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);

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
