import React, { useState } from 'react';
import { SearchRuleViewModel } from '../types';

interface SearchRulesPaneProps {
  rules: SearchRuleViewModel[];
}

export const SearchRulesPane: React.FC<SearchRulesPaneProps> = ({ rules }) => {
  const [ruleList, setRuleList] = useState<SearchRuleViewModel[]>(rules);
  const [newKeyword, setNewKeyword] = useState<string>('');

  const handleToggle = (id: number) => {
    setRuleList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const newRule: SearchRuleViewModel = {
      id: Date.now(),
      keyword: newKeyword.trim(),
      enabled: true,
      intervalMinutes: 15,
      lastCheckedAt: '未実行'
    };
    setRuleList([...ruleList, newRule]);
    setNewKeyword('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">ニュース監視ルール設定</h2>
        <p className="text-xs text-gray-500">
          YouTube Data API v3 で定期監視する検索キーワードおよび自動実行条件を設定します。
        </p>
      </div>

      {/* Add New Rule Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="新規監視キーワードを入力 (例: 台風 警報 交通)"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 px-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow-sm"
        >
          ルール追加
        </button>
      </form>

      {/* Rules List Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
            <tr>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3">監視キーワード</th>
              <th className="px-4 py-3">実行間隔</th>
              <th className="px-4 py-3">最終チェック</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700">
            {ruleList.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50/80 transition">
                <td className="px-4 py-3">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="ml-2 font-medium">
                    {rule.enabled ? '有効' : '停止'}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">{rule.keyword}</td>
                <td className="px-4 py-3">{rule.intervalMinutes}分毎</td>
                <td className="px-4 py-3 text-gray-500">{rule.lastCheckedAt || '未実行'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    {rule.enabled ? '無効化' : '有効化'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
