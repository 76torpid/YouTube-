import React from 'react';
import { NewsArticleViewModel } from '../types';

interface DetailPaneProps {
  article: NewsArticleViewModel;
}

export const DetailPane: React.FC<DetailPaneProps> = ({ article }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {article.category}
          </span>
          <span className="text-xs text-gray-500 font-medium">{article.publishedAt}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2">{article.title}</h2>
        <div className="text-xs text-gray-500 font-medium">配信チャンネル: {article.channelTitle}</div>
      </div>

      {/* AI Summary Block */}
      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl p-4 border border-blue-100/60">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>✨ AI構造化要約 (Workers AI)</span>
        </h3>
        <p className="text-sm text-gray-800 leading-relaxed mb-3">{article.summary}</p>
        <ul className="space-y-1.5">
          {article.bulletPoints.map((pt, idx) => (
            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Location Map & Details */}
      {article.locationName && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            📍 現場位置情報
          </h3>
          <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
            <div className="text-sm font-bold text-gray-900 mb-1">{article.locationName}</div>
            <div className="text-xs text-gray-600 mb-2">{article.address}</div>

            {/* Embedded Visual Map Preview */}
            <div className="h-44 bg-blue-50/80 rounded-md border border-blue-200/60 flex flex-col items-center justify-center relative overflow-hidden text-center p-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md mb-1 animate-bounce">
                📍
              </div>
              <div className="text-xs font-bold text-gray-800">{article.locationName}</div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                {article.latitude?.toFixed(4)}, {article.longitude?.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <a
          href={article.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
        >
          <span>▶ YouTubeで動画を視聴</span>
        </a>

        {article.locationName && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              article.address || article.locationName
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>🗺️ Google Mapsで開く</span>
          </a>
        )}
      </div>
    </div>
  );
};
