import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { DetailPane } from './components/DetailPane';
import { SearchRulesPane } from './components/SearchRulesPane';
import { MOCK_NEWS_ARTICLES, MOCK_SEARCH_RULES, NewsArticleViewModel, SearchRuleViewModel } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'news' | 'rules'>('news');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [articles, setArticles] = useState<NewsArticleViewModel[]>([]);
  const [rules, setRules] = useState<SearchRuleViewModel[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleViewModel | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles and rules from API
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [artRes, ruleRes] = await Promise.all([
          fetch('/api/articles'),
          fetch('/api/search-rules')
        ]);

        if (artRes.ok) {
          const artData = await artRes.json();
          const fetchedArticles: NewsArticleViewModel[] = artData.articles || [];
          if (fetchedArticles.length > 0) {
            setArticles(fetchedArticles);
            setSelectedArticle(fetchedArticles[0]);
          } else {
            // Fallback to mock fixtures if DB is empty
            setArticles(MOCK_NEWS_ARTICLES);
            setSelectedArticle(MOCK_NEWS_ARTICLES[0]);
          }
        } else {
          setArticles(MOCK_NEWS_ARTICLES);
          setSelectedArticle(MOCK_NEWS_ARTICLES[0]);
        }

        if (ruleRes.ok) {
          const ruleData = await ruleRes.json();
          if (ruleData.rules && ruleData.rules.length > 0) {
            const mappedRules: SearchRuleViewModel[] = ruleData.rules.map((r: { id: number; keyword: string; enabled: number; interval_minutes: number; last_checked_at?: string }) => ({
              id: r.id,
              keyword: r.keyword,
              enabled: Boolean(r.enabled),
              intervalMinutes: r.interval_minutes,
              lastCheckedAt: r.last_checked_at
            }));
            setRules(mappedRules);
          } else {
            setRules(MOCK_SEARCH_RULES);
          }
        } else {
          setRules(MOCK_SEARCH_RULES);
        }
      } catch (err: unknown) {
        console.warn('API fetch failed, utilizing ViewModel mock adapter fallback:', err);
        setArticles(MOCK_NEWS_ARTICLES);
        setSelectedArticle(MOCK_NEWS_ARTICLES[0]);
        setRules(MOCK_SEARCH_RULES);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter news articles based on search query
  const filteredArticles = articles.filter((art) => {
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
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
            <p className="font-semibold text-gray-700">最新ニュースデータを読み込み中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-8 text-center text-red-700 text-sm shadow-sm">
            <p className="font-bold mb-1">エラーが発生しました</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : activeTab === 'news' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: News Feed Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  最新ニュースフィード ({filteredArticles.length}件)
                </h2>
                <span className="text-xs text-gray-500 font-medium">取得完了</span>
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
                    isSelected={selectedArticle?.id === article.id}
                    onSelect={setSelectedArticle}
                  />
                ))
              )}
            </div>

            {/* Right: Selected Article Detail & Location Pane */}
            <div className="lg:col-span-5">
              <div className="sticky top-20">
                {selectedArticle && <DetailPane article={selectedArticle} />}
              </div>
            </div>
          </div>
        ) : (
          <SearchRulesPane rules={rules} />
        )}
      </main>
    </div>
  );
}

export default App;
