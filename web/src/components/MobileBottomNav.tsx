import React from 'react';
import { 
  Newspaper, 
  Map, 
  SlidersHorizontal, 
  Volume2, 
  Columns
} from 'lucide-react';
import { ViewMode } from '../types/news';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenKeywordModal: () => void;
  activeKeywordCount: number;
  onToggleAudioPlayer: () => void;
  isAudioOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  onViewModeChange,
  onOpenKeywordModal,
  activeKeywordCount,
  onToggleAudioPlayer,
  isAudioOpen,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        
        {/* News List */}
        <button
          onClick={() => onViewModeChange('list')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            viewMode === 'list'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">ニュース一覧</span>
        </button>

        {/* Map View */}
        <button
          onClick={() => onViewModeChange('map')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            viewMode === 'map'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">現場マップ</span>
        </button>

        {/* Keyword Manager */}
        <button
          onClick={onOpenKeywordModal}
          className="relative flex flex-col items-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5 text-amber-500" />
            <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-red-600 text-white">
              {activeKeywordCount}
            </span>
          </div>
          <span className="text-[10px] mt-0.5">キーワード</span>
        </button>

        {/* Audio Briefing */}
        <button
          onClick={onToggleAudioPlayer}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            isAudioOpen
              ? 'text-rose-600 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Volume2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">音声朗読</span>
        </button>

      </div>
    </nav>
  );
};
