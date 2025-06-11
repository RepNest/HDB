import { useCallback } from 'react';

export const useNavigate = () => {
  return useCallback((url: string) => {
    const event = new CustomEvent('open-tab', { detail: { url } });
    window.dispatchEvent(event);
  }, []);
};