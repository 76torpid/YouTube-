import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Check, 
  CheckSquare, 
  Square, 
  Search, 
  Bookmark, 
  Trash2, 
  Sparkles, 
  Flame, 
  Sliders, 
  FolderPlus,
  RotateCcw,
  Zap,
  Tag
} from 'lucide-react';
import { KeywordPreset } from '../types/news';

interface KeywordManagerProps {
  keywords: string[];
  activeKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  onActiveKeywordsChange: (activeKeywords: string[]) => void;
  onExecuteSearch: (activeKeywords: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PRESET_BUNDLES: KeywordPreset[] = [
  {
    id: 'preset-breaking',
    name: '🚨 事件・事故・火災速報',
    keywords: ['事件', '事故', '火災', '速報', '逮捕', '警察'],
    description: '最新の事件、交通事故、火災、警察捜査の現場速報'
  },
  {
    id: 'preset-disaster',
    name: '🌦️ 気象・地震・災害・台風',
    keywords: ['地震', '台風', '線状降水帯', '大雨', '避難指示', '気象庁', '氾濫'],
    description: '全国の気象警報、地震情報、河川氾濫、災害対策'
  },
  {
    id: 'preset-politics-economy',
    name: '🏛️ 政治・経済・日銀・為替',
    keywords: ['政治', '日銀', '株価', '為替', '首相', '国会', '金利', '物価'],
    description: '政策発表、経済動向、市場変化、政府会見'
  },
  {
    id: 'preset-tech-ai',
    name: '🤖 AI・最新テクノロジー・IT',
    keywords: ['生成AI', 'Google', 'ChatGPT', 'ロボット', '半導体', 'テクノロジー', '新技術'],
    description: '人工知能、デジタル変革、最先端ガジェットニュース'
  },
  {
    id: 'preset-traffic',
    name: '🚄 交通・新幹線・道路・鉄道',
    keywords: ['新幹線', '運転見合わせ', '首都高速', 'JR', '遅延', '高速道路', '航空便'],
    description: '鉄道運行情報、高速道路規制、空港フライト状況'
  },
  {
    id: 'preset-entertainment',
    name: '🎭 カルチャー・エンタメ・話題',
    keywords: ['エンタメ', '映画', 'アニメ', 'フェス', '話題', 'トレンド', '人気スポット'],
    description: '音楽フェス、文化イベント、YouTube急上昇トレンド'
  },
  {
    id: 'preset-tokyo',
    name: '🗾 首都圏（東京・神奈川・埼玉・千葉）',
    keywords: ['東京都', '新宿', '渋谷', '銀座', '横浜', 'さいたま', '千葉'],
    description: '首都圏エリアのローカルニュースと現場速報'
  },
  {
    id: 'preset-kansai',
    name: '🗾 関西（大阪・京都・兵庫）',
    keywords: ['大阪府', 'ミナミ', '梅田', '京都市', '神戸', '関西'],
    description: '関西圏の注目トピックと地域ニュース'
  }
];

const SAVED_PRESETS_KEY = 'yt_news_custom_presets_v1';

export const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  activeKeywords,
  onKeywordsChange,
  onActiveKeywordsChange,
  onExecuteSearch,
  isOpen,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [savedPresets, setSavedPresets] = useState<KeywordPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load custom saved presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_PRESETS_KEY);
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load saved presets', e);
    }
  }, []);

  const handleAddKeyword = () => {
    if (!inputVal.trim()) return;
    
    // Support comma or space separated input
    const parts = inputVal.split(/[,、\s]+/).map(s => s.trim()).filter(Boolean);
    const newKeywords = Array.from(new Set([...keywords, ...parts]));
    const newActives = Array.from(new Set([...activeKeywords, ...parts]));
    
    onKeywordsChange(newKeywords);
    onActiveKeywordsChange(newActives);
    setInputVal('');
  };

  const handleToggleKeyword = (kw: string) => {
    if (activeKeywords.includes(kw)) {
      onActiveKeywordsChange(activeKeywords.filter(k => k !== kw));
    } else {
      onActiveKeywordsChange([...activeKeywords, kw]);
    }
  };

  const handleDeleteKeyword = (kw: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onKeywordsChange(keywords.filter(k => k !== kw));
    onActiveKeywordsChange(activeKeywords.filter(k => k !== kw));
  };

  const handleSelectAll = () => {
    onActiveKeywordsChange([...keywords]);
  };

  const handleDeselectAll = () => {
    onActiveKeywordsChange([]);
  };

  const handleApplyPreset = (preset: KeywordPreset) => {
    const combined = Array.from(new Set([...keywords, ...preset.keywords]));
    onKeywordsChange(combined);
    onActiveKeywordsChange(preset.keywords);
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim() || activeKeywords.length === 0) return;
    const newPreset: KeywordPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      keywords: [...activeKeywords],
      description: `カスタム設定 (${activeKeywords.length}個のキーワード)`
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(updated));
    setNewPresetName('');
    setShowSavePreset(false);
  };

  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(updated));
  };

  const handleResetToDefaults = () => {
    const defaultKws = ['国内ニュース', '事件事故', '速報', '政治', '気象', '最新トレンド'];
    onKeywordsChange(defaultKws);
    onActiveKeywordsChange(defaultKws);
  };

  const handleExecute = () => {
    onExecuteSearch(activeKeywords);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                検索キーワードの複数設定
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                チェックしたキーワードをまとめてYouTubeニュースから収集・要約します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Add Custom Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              キーワードの追加 (カンマやスペース区切りで複数一括登録可能)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="例: 新宿火災, 東海道新幹線, 日銀利上げ, 渋谷"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-red-500 focus:outline-hidden"
                />
              </div>
              <button
                onClick={handleAddKeyword}
                disabled={!inputVal.trim()}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white transition-all disabled:opacity-40 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                追加
              </button>
            </div>
          </div>

          {/* Active Keywords Pool */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  登録済みキーワード一覧
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                  {activeKeywords.length} / {keywords.length} 件 選択中
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleSelectAll}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                >
                  全選択
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium"
                >
                  全解除
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={handleResetToDefaults}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium"
                >
                  初期化
                </button>
              </div>
            </div>

            {keywords.length === 0 ? (
              <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                キーワードがありません。上の入力欄または下のプリセットから追加してください。
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                {keywords.map((kw) => {
                  const isActive = activeKeywords.includes(kw);
                  return (
                    <div
                      key={kw}
                      onClick={() => handleToggleKeyword(kw)}
                      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border select-none ${
                        isActive
                          ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300'
                      }`}
                    >
                      {isActive ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>{kw}</span>
                      <button
                        onClick={(e) => handleDeleteKeyword(kw, e)}
                        className={`ml-1 p-0.5 rounded-full hover:bg-black/20 transition-colors ${
                          isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="キーワードを削除"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Preset Bundles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                おすすめカテゴリ別プリセット（ワンクリック適用）
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_PRESET_BUNDLES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="flex flex-col text-left p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-red-400 dark:hover:border-red-500 transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400">
                      {preset.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono">
                      {preset.keywords.length}語
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preset.keywords.slice(0, 4).map((k) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                        #{k}
                      </span>
                    ))}
                    {preset.keywords.length > 4 && (
                      <span className="text-[10px] text-slate-400">+{preset.keywords.length - 4}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Saved Sets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                マイ保存プリセット
              </span>
              <button
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                現在の選択を保存
              </button>
            </div>

            {showSavePreset && (
              <div className="flex gap-2 p-3 mb-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 animate-in fade-in">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="プリセット名 (例: 毎朝チェックセット)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 focus:outline-hidden"
                />
                <button
                  onClick={handleSaveCurrentAsPreset}
                  disabled={!newPresetName.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  保存
                </button>
              </div>
            )}

            {savedPresets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer transition-all"
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {preset.keywords.join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                保存されたカスタムプリセットはありません。よく使う検索キーワードの組み合わせを保存できます。
              </p>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            選択中: <strong className="text-red-600 font-bold">{activeKeywords.length}</strong> 個のキーワード
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              閉じる
            </button>
            <button
              onClick={handleExecute}
              disabled={activeKeywords.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30 transition-all disabled:opacity-40"
            >
              <Search className="w-4 h-4" />
              選択中のキーワードで検索実行 ({activeKeywords.length}件)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
