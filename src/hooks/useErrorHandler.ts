import { useState, useCallback } from 'react';

interface ErrorState {
  message: string | null;
  clear: () => void;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    return message;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};