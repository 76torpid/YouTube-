import React from 'react';
import { 
  Tv, 
  MapPin, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  Volume2, 
  Moon, 
  Sun, 
  Compass, 
  Layers,
  Sparkles,
  Map,
  List,
  Columns
} from 'lucide-react';
import { ViewMode } from '../types/news';

interface NavbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenKeywordModal: () => void;
  activeKeywordCount: number;
  totalNewsCount: number;
  locatedNewsCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAudioBriefing: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isLoading,
  viewMode,
  onViewModeChange,
  onOpenKeywordModal,
  activeKeywordCount,
  totalNewsCount,
  locatedNewsCount,
  darkMode,
  onToggleDarkMode,
  onOpenAudioBriefing,
  searchQuery,
  onSearchQueryChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-500 to-rose-600 text-white shadow-md shadow-red-500/20">
              <Tv className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  YouTube<span className="text-red-600">ニュース</span>現場マップ
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  <Sparkles className="w-3 h-3 mr-0.5" /> AI要約 & 現場特定
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                YouTube日本版の最新話題を収集・住所特定してGoogleマップ連動
              </p>
            </div>
          </div>

          {/* Quick Keyword Filter & Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="ニュースタイトル・現場住所・キーワードで絞り込み..."
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchQueryChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Multi-keyword configure button */}
            <button
              onClick={onOpenKeywordModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
              title="複数検索キーワード設定"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">キーワード設定</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-red-600 text-white min-w-4.5">
                {activeKeywordCount}
              </span>
            </button>

            {/* AI Audio News Briefing */}
            <button
              onClick={onOpenAudioBriefing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-900/50"
              title="AI音声ニュース朗読"
            >
              <Volume2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="hidden md:inline">音声要約</span>
            </button>

            {/* View Mode Toggle (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onViewModeChange('split')}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="分割表示（一覧 + マップ）"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="一覧カード表示"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('map')}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="全画面マップ表示"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="YouTube最新ニュースを再収集"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'ライトモードに切替' : 'ダークモードに切替'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="block lg:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="タイトル・現場住所・キーワードで検索..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </div>

      </div>
    </header>
  );
};
