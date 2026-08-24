import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Share2, 
  Check, 
  Clock, 
  Radio, 
  Sparkles, 
  Bookmark,
  Layers,
  Compass,
  Tv,
  CheckCircle2
} from 'lucide-react';
import { NewsItem } from '../types/news';

interface NewsDetailModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusMap: (item: NewsItem) => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onFocusMap,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${item.title}。${item.summary}。要点として、${item.bulletPoints.join('。')}。現場の住所は、${item.location?.address || '特定中'}です。`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.05;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = () => {
    const text = `【${item.title}】\n${item.summary}\n\n現場住所: ${item.location?.address || '未特定'}\n${item.youtubeUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const googleMapsUrl = item.location?.googleMapsUrl || 
    (item.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location.address || `${item.location.lat},${item.location.lng}`)}` : '');

  const googleDirectionsUrl = item.location ? 
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location.address || `${item.location.lat},${item.location.lng}`)}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
              <Radio className="w-4 h-4 animate-pulse" />
              {item.channelName}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.publishedAt}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReadAloud}
              className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                isPlayingAudio 
                  ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="AI音声朗読"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              title="テキストをコピー"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
          
          {/* Title */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {item.importance === 'breaking' && (
                <span className="inline-flex items-center px-2 py-0.5 mr-2 rounded-md text-xs font-extrabold bg-red-600 text-white animate-pulse">
                  速報
                </span>
              )}
              {item.title}
            </h2>
          </div>

          {/* YouTube Video Link Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/90">YouTube公式配信で視聴</p>
                <p className="text-xs text-white/80 line-clamp-1">{item.channelName} の最新動画</p>
              </div>
            </div>
            <a
              href={item.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-red-600 hover:bg-red-50 transition-colors shadow-sm"
            >
              <span>YouTubeで動画を見る</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* AI Summary Block */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>AI要約解説</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
              {item.summary}
            </p>

            {/* Key Bullet Points */}
            {item.bulletPoints && item.bulletPoints.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">重要ポイント：</p>
                {item.bulletPoints.map((bp, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location & Google Map Interactive Embed */}
          {item.location && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>特定された現場住所 & Google マップ</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  精度: {item.location.accuracy === 'exact' ? '番地・施設特定' : '市区町村レベル'}
                </span>
              </div>

              {/* Address Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/80 to-amber-50/80 dark:from-slate-800 dark:to-slate-800/90 border border-red-100 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">施設・スポット名:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.location.spotName || '一般施設 / 路上'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">都道府県・市区町村:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.location.prefecture} {item.location.city}
                    </p>
                  </div>
                  <div className="sm:col-span-2 mt-1">
                    <span className="text-slate-400">現場住所:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.location.address}
                    </p>
                  </div>
                </div>

                {/* Google Map Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-red-200/60 dark:border-slate-700">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Google マップで開く</span>
                  </a>

                  <a
                    href={googleDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>経路を検索</span>
                  </a>

                  <button
                    onClick={() => {
                      onFocusMap(item);
                      onClose();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>アプリ内マップで見る</span>
                  </button>
                </div>
              </div>

              {/* Embedded Google Maps Preview Frame */}
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <iframe
                  title="Google Maps Embed"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${item.location.lat},${item.location.lng}&hl=ja&z=15&output=embed`}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Keywords tags */}
          {item.keywords && item.keywords.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">関連トピックタグ:</span>
              <div className="flex flex-wrap gap-1.5">
                {item.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <span className="text-xs text-slate-400">
            YouTube日本版ニューストピック・AI現場特定システム
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
