const FAVICON_CACHE_KEY = 'spartan_favicon_cache';

const loadCache = (): Record<string, string> => {
  try {
    const cached = localStorage.getItem(FAVICON_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const saveCache = (cache: Record<string, string>) => {
  try {
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Failed to save favicon cache:', err);
  }
};

const faviconCache: Record<string, string> = loadCache();

export const getFaviconUrl = async (pageUrl: string): Promise<string> => {
  if (faviconCache[pageUrl]) {
    return faviconCache[pageUrl];
  }

  try {
    const response = await fetch(pageUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const faviconLink = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (faviconLink && faviconLink.getAttribute('href')) {
      const faviconPath = faviconLink.getAttribute('href')!;
      const faviconUrl = faviconPath.startsWith('http') ? faviconPath : new URL(faviconPath, pageUrl).href;
      faviconCache[pageUrl] = faviconUrl;
      saveCache(faviconCache);
      return faviconUrl;
    }
  } catch (err: unknown) {
    console.warn(`Failed to fetch favicon for ${pageUrl}: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  const fallback = `https://${new URL(pageUrl).hostname}/favicon.ico`;
  faviconCache[pageUrl] = fallback;
  saveCache(faviconCache);
  return fallback;
};