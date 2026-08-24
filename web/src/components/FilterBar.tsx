import React from 'react';
import { 
  Filter, 
  MapPin, 
  Clock, 
  ArrowUpDown, 
  Check, 
  ChevronDown,
  Sparkles,
  Flame,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import { NewsCategory, SearchFilterState } from '../types/news';

interface FilterBarProps {
  filters: SearchFilterState;
  onFilterChange: (filters: Partial<SearchFilterState>) => void;
  onOpenKeywordModal: () => void;
  activeKeywordCount: number;
}

const CATEGORIES: { id: NewsCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'すべて', icon: '🔥' },
  { id: 'accident', label: '事件・事故', icon: '🚨' },
  { id: 'weather', label: '気象・災害', icon: '🌦️' },
  { id: 'politics', label: '政治・経済', icon: '🏛️' },
  { id: 'tech', label: 'テクノロジー', icon: '🤖' },
  { id: 'society', label: '社会・生活', icon: '🏢' },
  { id: 'entertainment', label: 'エンタメ', icon: '🎭' },
  { id: 'local', label: '地域ローカル', icon: '🗾' },
];

const REGIONS = [
  { id: 'all', label: '全国' },
  { id: 'kanto', label: '関東・首都圏' },
  { id: 'kansai', label: '関西・近畿' },
  { id: 'chubu', label: '中部・東海・北陸' },
  { id: 'tohoku_hokkaido', label: '北海道・東北' },
  { id: 'chugoku_shikoku', label: '中国・四国' },
  { id: 'kyushu_okinawa', label: '九州・沖縄' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onOpenKeywordModal,
  activeKeywordCount,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 space-y-2.5 transition-colors">
      
      {/* Category Pills (Horizontal Scroll on Mobile) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.id })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs shadow-red-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Keyword Config Pill */}
        <button
          onClick={onOpenKeywordModal}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
          <span>キーワード ({activeKeywordCount})</span>
        </button>
      </div>

      {/* Secondary Controls: Region, Location-Only Toggle, Sort By */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        
        {/* Left: Location Only Filter & Region Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location Only Toggle */}
          <button
            onClick={() => onFilterChange({ onlyWithLocation: !filters.onlyWithLocation })}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              filters.onlyWithLocation
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${filters.onlyWithLocation ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>現場住所ありのみ</span>
            {filters.onlyWithLocation && <Check className="w-3 h-3 text-emerald-600" />}
          </button>

          {/* Region Select */}
          <div className="relative">
            <select
              value={filters.region}
              onChange={(e) => onFilterChange({ region: e.target.value })}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 pl-3 pr-7 py-1.5 rounded-lg border border-transparent focus:border-red-500 focus:outline-hidden font-medium cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Time Range */}
          <div className="relative">
            <select
              value={filters.timeRange}
              onChange={(e) => onFilterChange({ timeRange: e.target.value as any })}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 pl-3 pr-7 py-1.5 rounded-lg border border-transparent focus:border-red-500 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="today">今日</option>
              <option value="24h">過去24時間</option>
              <option value="3days">過去3日</option>
              <option value="week">今週</option>
              <option value="all">全期間</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Right: Sort Options */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 ml-auto">
          <ArrowUpDown className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">並び順:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="appearance-none bg-transparent font-semibold text-slate-800 dark:text-slate-200 pr-4 cursor-pointer focus:outline-hidden"
          >
            <option value="latest">最新配信順</option>
            <option value="importance">速報・重要度順</option>
            <option value="location">現場特定順</option>
          </select>
        </div>

      </div>

    </div>
  );
};
