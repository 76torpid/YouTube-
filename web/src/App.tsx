import React, { useState } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { DetailPane } from './components/DetailPane';
import { SearchRulesPane } from './components/SearchRulesPane';
import { MOCK_NEWS_ARTICLES, MOCK_SEARCH_RULES, NewsArticleViewModel } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'news' | 'rules'>('news');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleViewModel>(MOCK_NEWS_ARTICLES[0]);

  // Filter news articles based on search query
  const filteredArticles = MOCK_NEWS_ARTICLES.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q)) ||
      art.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'news' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: News Feed Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  最新ニュースフィード ({filteredArticles.length}件)
                </h2>
                <span className="text-xs text-gray-500 font-medium">更新: 16:30</span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                  該当するニュースは見つかりませんでした。
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    isSelected={selectedArticle.id === article.id}
                    onSelect={setSelectedArticle}
                  />
                ))
              )}
            </div>

            {/* Right: Selected Article Detail & Location Pane */}
            <div className="lg:col-span-5">
              <div className="sticky top-20">
                <DetailPane article={selectedArticle} />
              </div>
            </div>
          </div>
        ) : (
          <SearchRulesPane rules={MOCK_SEARCH_RULES} />
        )}
      </main>
    </div>
  );
}

export default App;
