import React from 'react';
import { NewsArticleViewModel } from '../types';

interface NewsCardProps {
  article: NewsArticleViewModel;
  isSelected: boolean;
  onSelect: (article: NewsArticleViewModel) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(article)}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition shadow-sm hover:shadow-md ${
        isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'
      }`}
    >
      <div className="flex gap-4 items-start">
        {/* Thumbnail */}
        <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative border border-gray-100">
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            LIVE
          </span>
        </div>

        {/* Info Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {article.category}
            </span>
            <span className="text-xs text-gray-400 font-medium">{article.publishedAt}</span>
          </div>

          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">
            {article.title}
          </h3>

          <div className="text-xs text-gray-500 font-medium mb-2">{article.channelTitle}</div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <span key={tag} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Summary Highlight */}
      <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/60 rounded-lg p-2.5 text-xs text-gray-700 leading-relaxed">
        <div className="font-bold text-blue-900 mb-1 flex items-center gap-1">
          <span>✨ AI要約ハイライト</span>
        </div>
        <p className="line-clamp-2">{article.summary}</p>
      </div>
    </div>
  );
};
