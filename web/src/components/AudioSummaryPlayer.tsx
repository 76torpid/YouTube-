import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Volume2, 
  Radio, 
  MapPin,
  Sparkles,
  Gauge
} from 'lucide-react';
import { NewsItem } from '../types/news';

interface AudioSummaryPlayerProps {
  items: NewsItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNews: (item: NewsItem) => void;
}

export const AudioSummaryPlayer: React.FC<AudioSummaryPlayerProps> = ({
  items,
  isOpen,
  onClose,
  onSelectNews,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.1);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    }
  }, [isOpen]);

  const speakItem = (index: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (index >= items.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    const item = items[index];
    setCurrentIndex(index);
    onSelectNews(item);

    const locationText = item.location?.address 
      ? `現場は、${item.location.address}です。`
      : '';

    const text = `第${index + 1}のニュース。${item.channelName}より、${item.title}。${item.summary}。${locationText}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = playbackRate;

    utterance.onend = () => {
      if (index + 1 < items.length) {
        speakItem(index + 1);
      } else {
        setIsPlaying(false);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      speakItem(currentIndex);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % items.length;
    speakItem(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    speakItem(prevIdx);
  };

  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 max-w-md w-full sm:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              AI音声ニュースブリーフィング
            </h4>
            <p className="text-[10px] text-slate-500">
              {currentIndex + 1} / {items.length} 件を連続再生中
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Current Playing News Info */}
      {currentItem && (
        <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 mr-1.5">
            {currentItem.channelName}
          </span>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mt-1">
            {currentItem.title}
          </p>
          {currentItem.location && (
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
              {currentItem.location.address}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        
        {/* Playback speed */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Gauge className="w-3.5 h-3.5" />
          <button
            onClick={() => setPlaybackRate(playbackRate === 1.1 ? 1.3 : playbackRate === 1.3 ? 0.9 : 1.1)}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Play / Next / Prev */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/30 transition-all scale-100 hover:scale-105"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12"></div>
      </div>

    </div>
  );
};
