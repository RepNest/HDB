import { debounce } from 'lodash';
import { HistoryEntry, Favorites } from '../types';

const HISTORY_CACHE: HistoryEntry[] = [];
const MAX_HISTORY = 50;
const LAST_SAVED_URLS = new Set<string>();

const saveHistoryDebounced = debounce(async (history: HistoryEntry[]) => {
  try {
    await window.electronAPI.saveHistory(history);
    LAST_SAVED_URLS.clear();
  } catch (err: unknown) {
    console.warn('Failed to save history:', err instanceof Error ? err.message : 'Unknown error');
  }
}, 300);

export const saveHistory = async (url: string, existingHistory: HistoryEntry[]): Promise<void> => {
  if (!url || LAST_SAVED_URLS.has(url)) return;

  const newEntry: HistoryEntry = { url, timestamp: new Date().toISOString() };
  LAST_SAVED_URLS.add(url);

  const updatedHistory = [newEntry, ...existingHistory.filter((entry) => entry.url !== url)].slice(0, MAX_HISTORY);
  HISTORY_CACHE.splice(0, HISTORY_CACHE.length, ...updatedHistory);

  await saveHistoryDebounced(updatedHistory);
};

export const getHistory = async (limit: number = MAX_HISTORY): Promise<HistoryEntry[]> => {
  if (HISTORY_CACHE.length > 0) {
    return HISTORY_CACHE.slice(0, limit);
  }

  try {
    const history = await window.electronAPI.getHistory();
    HISTORY_CACHE.splice(0, HISTORY_CACHE.length, ...history);
    return history.slice(0, limit);
  } catch (err: unknown) {
    console.warn('Failed to fetch history:', err instanceof Error ? err.message : 'Unknown error');
    return [];
  }
};

export const filterHistory = (
  query: string,
  history: HistoryEntry[],
  favorites: Favorites,
  limit: number = 10
): HistoryEntry[] => {
  if (!query) return history.slice(0, limit);

  const lowerQuery = query.toLowerCase();
  const historyMatches = history
    .filter((entry) => entry.url.toLowerCase().includes(lowerQuery))
    .slice(0, Math.ceil(limit / 2));

  const bookmarkMatches = Object.values(favorites)
    .flat()
    .filter(
      (fav) => fav.name.toLowerCase().includes(lowerQuery) || fav.url.toLowerCase().includes(lowerQuery)
    )
    .map((fav) => ({ url: fav.url, timestamp: '' }))
    .slice(0, Math.ceil(limit / 2));

  return [...historyMatches, ...bookmarkMatches].slice(0, limit);
};