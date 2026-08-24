import React, { useState } from 'react';
import { 
  Play, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  Share2, 
  Check, 
  Sparkles, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  Flame,
  Building,
  Radio
} from 'lucide-react';
import { NewsItem, NewsCategory } from '../types/news';

interface NewsCardProps {
  item: NewsItem;
  isSelected?: boolean;
  onSelect: (item: NewsItem) => void;
  onOpenDetailModal: (item: NewsItem) => void;
  onFocusMapLocation: (item: NewsItem) => void;
  onToggleBookmark?: (id: string) => void;
}

const CATEGORY_BADGES: Record<NewsCategory, { label: string; bg: string; text: string; icon: string }> = {
  all: { label: '総合', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: '📰' },
  accident: { label: '事件・事故', bg: 'bg-red-50 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-300', icon: '🚨' },
  weather: { label: '気象・災害', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', icon: '🌦️' },
  politics: { label: '政治・経済', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', icon: '🏛️' },
  tech: { label: 'テクノロジー', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', icon: '🤖' },
  society: { label: '社会・生活', bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-300', icon: '🏢' },
  entertainment: { label: 'エンタメ', bg: 'bg-pink-50 dark:bg-pink-950/50', text: 'text-pink-700 dark:text-pink-300', icon: '🎭' },
  international: { label: '国際情勢', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', icon: '🌍' },
  local: { label: '地域ローカル', bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-300', icon: '🗾' },
};

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  isSelected,
  onSelect,
  onOpenDetailModal,
  onFocusMapLocation,
  onToggleBookmark,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryInfo = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.all;

  // Text-To-Speech for reading summary aloud
  const handleReadAloud = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('お使いのブラウザは音声読み上げに対応していません。');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${item.title}。${item.summary}。現場は、${item.location?.address || '特定中'}です。`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.05;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `【${item.title}】\n${item.summary}\n現場: ${item.location?.address || ''}\n${item.youtubeUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const googleMapsSearchUrl = item.location?.googleMapsUrl || 
    (item.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location.address || `${item.location.lat},${item.location.lng}`)}` : '');

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-red-500 ring-2 ring-red-500/20 shadow-lg dark:shadow-red-950/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Top Banner with Channel, Time & Importance */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryInfo.bg} ${categoryInfo.text}`}>
            <span>{categoryInfo.icon}</span>
            <span>{categoryInfo.label}</span>
          </span>

          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            {item.channelName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{item.publishedAt}</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="px-4 pb-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
          {item.importance === 'breaking' && (
            <span className="inline-flex items-center px-1.5 py-0.5 mr-1.5 rounded text-[11px] font-extrabold bg-red-600 text-white animate-pulse">
              速報
            </span>
          )}
          {item.title}
        </h3>
      </div>

      {/* AI Summary Card Block */}
      <div className="px-4 py-2.5 mx-4 my-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold mb-1.5 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span>AI要約サマリー</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3 mb-2">
          {item.summary}
        </p>

        {/* 3 Bullet Points */}
        {item.bulletPoints && item.bulletPoints.length > 0 && (
          <ul className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
            {item.bulletPoints.slice(0, 3).map((bp, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                <span className="leading-snug">{bp}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Incident Location & Google Maps Section */}
      {item.location && (
        <div className="px-4 py-2 mt-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-50/70 to-orange-50/70 dark:from-slate-800 dark:to-slate-800/80 border border-red-100 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.location.spotName || `${item.location.prefecture} ${item.location.city}`}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 shrink-0">
                      現場特定
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {item.location.address}
                  </p>
                </div>
              </div>

              {/* Map Zoom button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusMapLocation(item);
                }}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors"
                title="アプリ内マップで位置をズーム表示"
              >
                <MapPin className="w-3 h-3 text-red-500" />
                <span>マップ</span>
              </button>
            </div>

            {/* Direct Google Maps External Button */}
            <div className="mt-2 pt-2 border-t border-red-200/50 dark:border-slate-700 flex items-center justify-between gap-2">
              <a
                href={googleMapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Navigation className="w-3 h-3 text-blue-500" />
                Google マップで現場住所を確認
              </a>
              <span className="text-[10px] text-slate-400">
                緯度: {item.location.lat.toFixed(3)}, 経度: {item.location.lng.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Tags */}
      {item.keywords && item.keywords.length > 0 && (
        <div className="px-4 py-1.5 flex flex-wrap gap-1">
          {item.keywords.slice(0, 5).map((kw, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* Card Bottom Actions */}
      <div className="mt-auto px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Read Aloud Button */}
          <button
            onClick={handleReadAloud}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              isPlayingAudio
                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 animate-pulse'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isPlayingAudio ? '読み上げ停止' : 'AI音声でニュースを読み上げ'}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Share/Copy */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="要約テキストをコピー"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Bookmark */}
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(item.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                item.isBookmarked
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="お気に入りに保存"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Details / YouTube Video Modal Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetailModal(item);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-red-600 dark:bg-slate-100 dark:hover:bg-red-600 text-white dark:text-slate-900 dark:hover:text-white transition-all shadow-xs"
        >
          <span>詳細・動画</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
