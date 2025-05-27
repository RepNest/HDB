Usage Instructions:
-------------------
1. Import the FavoritesBar component in your App.tsx or layout file:
   import FavoritesBar from './components/FavoritesBar';

2. Add a handler in App.tsx like:
   const openFavorite = (url: string) => {
     const id = Date.now().toString();
     setTabs(prev => [...prev, { id, url, title: url }]);
     setActiveTabId(id);
   };

3. Render the FavoritesBar like:
   <FavoritesBar onFavoriteClick={openFavorite} />

This bar pulls from window.userConfig.favorites and displays each as a clickable button.