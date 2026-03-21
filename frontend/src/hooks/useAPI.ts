import { useState, useCallback } from "react";

interface UseAPIResult<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<T | undefined>;
  reset: () => void;
}

export function useAPI<T = any>(
  asyncFn: () => Promise<T>
): UseAPIResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "An error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
