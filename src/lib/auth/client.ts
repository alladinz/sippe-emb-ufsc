import api, { setAccessToken, extractApiErrorMessage } from "../api";
import { useState, useEffect } from "react";

export const authClient = {
  signIn: {
    email: async (
      { email, password }: Record<string, string>,
      options?: {
        onSuccess?: (data: unknown) => void;
        onError?: (err: { error: { message: string } }) => void;
      }
    ) => {
      try {
        const { data } = await api.post('/auth/login', { email, senha: password });
        setAccessToken(data.accessToken);
        options?.onSuccess?.(data);
        return { data };
      } catch (error: unknown) {
        const message = extractApiErrorMessage(error, 'Erro ao fazer login.');
        options?.onError?.({ error: { message } });
        throw error;
      }
    },
  },
  signOut: async (options?: {
    fetchOptions?: {
      onSuccess?: () => void;
      onError?: (err: unknown) => void;
    };
  }) => {
    try {
      await api.post('/auth/logout');
      options?.fetchOptions?.onSuccess?.();
    } catch (error: unknown) {
      options?.fetchOptions?.onError?.(error);
      throw error;
    } finally {
      setAccessToken(null);
    }
  },
  resetPassword: async (
    { newPassword, token }: Record<string, string>,
    options?: {
      onSuccess?: (data: unknown) => void;
      onError?: (err: { error: { message: string } }) => void;
    }
  ) => {
    try {
      const { data } = await api.post('/auth/definir-senha', {
        token,
        novaSenha: newPassword,
      });
      options?.onSuccess?.(data);
      return { data };
    } catch (error: unknown) {
      const errorMsg = extractApiErrorMessage(
        error,
        'Erro ao redefinir senha. O link pode ter expirado.'
      );
      options?.onError?.({ error: { message: errorMsg } });
      throw error;
    }
  },
};

export function useSession() {
  const [data, setData] = useState<{
    user: { id: string; name: string | null; email: string | null; papel?: string };
  } | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
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
