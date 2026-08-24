import React from 'react';

interface HeaderProps {
  activeTab: 'news' | 'rules';
  setActiveTab: (tab: 'news' | 'rules') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              NW
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">NewsWatch</h1>
              <span className="text-xs text-gray-500 font-medium">YouTube ニュース監視 & AI要約</span>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="ニュース・タグ・キーワード検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition ${
                activeTab === 'news'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ニュースフィード
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition ${
                activeTab === 'rules'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              監視ルール設定
            </button>
          </nav>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 sm:hidden">
          <input
            type="text"
            placeholder="ニュース・キーワード検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
};
