import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchYouTubeNews 
} from './services/api';
import { 
  NewsItem, 
  SearchFilterState, 
  ViewMode, 
  NewsCategory 
} from './types/news';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { NewsCard } from './components/NewsCard';
import { NewsMap } from './components/NewsMap';
import { KeywordManager } from './components/KeywordManager';
import { NewsDetailModal } from './components/NewsDetailModal';
import { AudioSummaryPlayer } from './components/AudioSummaryPlayer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { 
  Tv, 
  MapPin, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  AlertCircle, 
  Sparkles, 
  Radio, 
  TrendingUp, 
  Layers,
  Flame,
  CheckCircle,
  Clock,
  Compass,
  Zap
} from 'lucide-react';

const STORAGE_KEYWORDS_KEY = 'yt_news_keywords_v1';
const STORAGE_ACTIVE_KEYWORDS_KEY = 'yt_news_active_keywords_v1';
const STORAGE_BOOKMARKS_KEY = 'yt_news_bookmarks_v1';
const STORAGE_THEME_KEY = 'yt_news_theme_v1';

const INITIAL_KEYWORDS = [
  '最新ニュース',
  '事件事故',
  '速報',
  '政治経済',
  '気象災害',
  'テクノロジー'
];

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  // Keywords State
  const [keywords, setKeywords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYWORDS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_KEYWORDS;
    } catch {
      return INITIAL_KEYWORDS;
    }
  });

  const [activeKeywords, setActiveKeywords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_KEYWORDS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_KEYWORDS.slice(0, 4);
    } catch {
      return INITIAL_KEYWORDS.slice(0, 4);
    }
  });

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filters State
  const [filters, setFilters] = useState<SearchFilterState>({
    keywords: INITIAL_KEYWORDS,
    activeKeywords: INITIAL_KEYWORDS.slice(0, 4),
    category: 'all',
    timeRange: 'today',
    region: 'all',
    searchQuery: '',
    onlyWithLocation: false,
    importanceOnly: false,
    sortBy: 'latest',
  });

  // News Items & UI State
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<NewsItem | null>(null);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isAudioBriefingOpen, setIsAudioBriefingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }, [darkMode]);

  // Persist keywords
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYWORDS_KEY, JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ACTIVE_KEYWORDS_KEY, JSON.stringify(activeKeywords));
  }, [activeKeywords]);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Initial Load & Keyword changes
  const loadNews = async (customActiveKeywords?: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const targetKeywords = customActiveKeywords || activeKeywords;
      const result = await fetchYouTubeNews({
        ...filters,
        activeKeywords: targetKeywords,
      });

      // Mark bookmarks
      const itemsWithBookmarks = result.items.map(item => ({
        ...item,
        isBookmarked: bookmarks.includes(item.id),
      }));

      setNewsItems(itemsWithBookmarks);
      setLastUpdated(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));

      // Auto select first item with location if available
      const firstWithLoc = itemsWithBookmarks.find(i => i.location);
      if (firstWithLoc) {
        setSelectedItem(firstWithLoc);
      } else if (itemsWithBookmarks.length > 0) {
        setSelectedItem(itemsWithBookmarks[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError('ニュースの収集・要約中にエラーが発生しました。再読み込みをお試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Handle Search Execution from Keyword Manager
  const handleExecuteKeywordSearch = (newActiveKeywords: string[]) => {
    setActiveKeywords(newActiveKeywords);
    loadNews(newActiveKeywords);
  };

  // Toggle bookmark
  const handleToggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
      setNewsItems(items =>
        items.map(item => item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item)
      );
      return next;
    });
  };

  // Filter & Search news items
  const filteredItems = useMemo(() => {
    let result = [...newsItems];

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category);
    }

    // Region filter
    if (filters.region !== 'all') {
      const regionMap: Record<string, string[]> = {
        kanto: ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県', '新宿', '渋谷', '銀座', '横浜'],
        kansai: ['大阪府', '京都府', '兵庫県', '滋賀県', '奈良県', '和歌山県', 'ミナミ', '梅田', '心斎橋', '神戸'],
        chubu: ['愛知県', '静岡県', '岐阜県', '三重県', '山梨県', '長野県', '新潟県', '富山県', '石川県', '福井県'],
        tohoku_hokkaido: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
        chugoku_shikoku: ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'],
        kyushu_okinawa: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', '博多', '天神'],
      };
      const validNames = regionMap[filters.region] || [];
      result = result.filter(item => {
        if (!item.location) return false;
        return validNames.some(name => 
          item.location?.prefecture.includes(name) ||
          item.location?.city.includes(name) ||
          item.location?.address.includes(name)
        );
      });
    }

    // Only with location
    if (filters.onlyWithLocation) {
      result = result.filter(item => item.location && item.location.lat && item.location.lng);
    }

    // Text search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.channelName.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q)) ||
        (item.location && (
          item.location.address.toLowerCase().includes(q) ||
          item.location.city.toLowerCase().includes(q) ||
          item.location.prefecture.toLowerCase().includes(q) ||
          (item.location.spotName && item.location.spotName.toLowerCase().includes(q))
        ))
      );
    }

    // Sorting
    if (filters.sortBy === 'latest') {
      // already sorted
    } else if (filters.sortBy === 'importance') {
      const rank = { breaking: 3, high: 2, normal: 1 };
      result.sort((a, b) => (rank[b.importance] || 0) - (rank[a.importance] || 0));
    } else if (filters.sortBy === 'location') {
      result.sort((a, b) => (b.location ? 1 : 0) - (a.location ? 1 : 0));
    }

    return result;
  }, [newsItems, filters]);

  const locatedNewsCount = useMemo(() => {
    return newsItems.filter(i => i.location && i.location.lat && i.location.lng).length;
  }, [newsItems]);

  const handleFocusMapLocation = (item: NewsItem) => {
    setSelectedItem(item);
    // On small screens, switch to map view
    if (window.innerWidth < 768) {
      setViewMode('map');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-16 sm:pb-0">
      
      {/* Top Navbar */}
      <Navbar
        onRefresh={() => loadNews()}
        isLoading={isLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenKeywordModal={() => setIsKeywordModalOpen(true)}
        activeKeywordCount={activeKeywords.length}
        totalNewsCount={newsItems.length}
        locatedNewsCount={locatedNewsCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAudioBriefing={() => setIsAudioBriefingOpen(true)}
        searchQuery={filters.searchQuery}
        onSearchQueryChange={(q) => setFilters(prev => ({ ...prev, searchQuery: q }))}
      />

      {/* Filter and Category Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
        onOpenKeywordModal={() => setIsKeywordModalOpen(true)}
        activeKeywordCount={activeKeywords.length}
      />

      {/* Active Keywords Status Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              検索キーワード:
            </span>
            {activeKeywords.map((kw) => (
              <span
                key={kw}
                onClick={() => setIsKeywordModalOpen(true)}
                className="shrink-0 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:border-red-400 transition-colors shadow-2xs"
              >
                #{kw}
              </span>
            ))}
            <button
              onClick={() => setIsKeywordModalOpen(true)}
              className="shrink-0 text-red-600 dark:text-red-400 font-bold hover:underline ml-1"
            >
              + 変更・追加
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-400 shrink-0">
            {lastUpdated && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                更新: {lastUpdated}
              </span>
            )}
            <span>
              該当: <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredItems.length}</strong> 件
            </span>
          </div>

        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 w-full">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadNews()}
              className="px-2.5 py-1 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700"
            >
              再試行
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col">
        
        {/* Loading Skeleton */}
        {isLoading && newsItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600">
              <Tv className="w-8 h-8 animate-bounce" />
              <div className="absolute inset-0 rounded-2xl border-4 border-red-500 border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                YouTube日本版の最新ニュースを収集中...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                設定されたキーワードに基づき、最新動画の要約と現場住所の特定を実行しています
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* View: Split Layout (Desktop default: Left Feed + Right Sticky Map) */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[calc(100vh-220px)]">
                
                {/* Left Column: News Cards Feed (7 cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <Search className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        該当するニュースが見つかりませんでした
                      </p>
                      <p className="text-xs text-slate-500">
                        検索キーワードやカテゴリのフィルタ条件を変更してください
                      </p>
                      <button
                        onClick={() => setIsKeywordModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm"
                      >
                        キーワード設定を開く
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {filteredItems.map((item) => (
                        <NewsCard
                          key={item.id}
                          item={item}
                          isSelected={selectedItem?.id === item.id}
                          onSelect={setSelectedItem}
                          onOpenDetailModal={setDetailModalItem}
                          onFocusMapLocation={handleFocusMapLocation}
                          onToggleBookmark={handleToggleBookmark}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Sticky Google Maps/Leaflet View (5 cols) */}
                <div className="hidden lg:block lg:col-span-5 relative">
                  <div className="sticky top-20 h-[calc(100vh-100px)] min-h-[500px]">
                    <NewsMap
                      items={filteredItems}
                      selectedItem={selectedItem}
                      onSelectItem={setSelectedItem}
                      onOpenDetailModal={setDetailModalItem}
                      isFullScreen={isMapFullScreen}
                      onToggleFullScreen={() => setViewMode('map')}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* View: Cards Only Layout */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      条件に一致するニュースがありません
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <NewsCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={setSelectedItem}
                        onOpenDetailModal={setDetailModalItem}
                        onFocusMapLocation={handleFocusMapLocation}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View: Fullscreen Map View */}
            {viewMode === 'map' && (
              <div className="flex-1 w-full h-[calc(100vh-180px)] min-h-[550px] relative">
                <NewsMap
                  items={filteredItems}
                  selectedItem={selectedItem}
                  onSelectItem={setSelectedItem}
                  onOpenDetailModal={setDetailModalItem}
                  isFullScreen={true}
                  onToggleFullScreen={() => setViewMode('split')}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* Keyword Configuration Modal */}
      <KeywordManager
        keywords={keywords}
        activeKeywords={activeKeywords}
        onKeywordsChange={setKeywords}
        onActiveKeywordsChange={setActiveKeywords}
        onExecuteSearch={handleExecuteKeywordSearch}
        isOpen={isKeywordModalOpen}
        onClose={() => setIsKeywordModalOpen(false)}
      />

      {/* News Detail & Google Maps Modal */}
      <NewsDetailModal
        item={detailModalItem}
        isOpen={!!detailModalItem}
        onClose={() => setDetailModalItem(null)}
        onFocusMap={handleFocusMapLocation}
      />

      {/* Audio Briefing Player */}
      <AudioSummaryPlayer
        items={filteredItems}
        isOpen={isAudioBriefingOpen}
        onClose={() => setIsAudioBriefingOpen(false)}
        onSelectNews={setSelectedItem}
      />

      {/* Mobile Smartphone Bottom Navigation Bar */}
      <MobileBottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenKeywordModal={() => setIsKeywordModalOpen(true)}
        activeKeywordCount={activeKeywords.length}
        onToggleAudioPlayer={() => setIsAudioBriefingOpen(!isAudioBriefingOpen)}
        isAudioOpen={isAudioBriefingOpen}
      />

    </div>
  );
}
