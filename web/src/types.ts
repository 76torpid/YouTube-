export interface NewsArticleViewModel {
  id: string;
  title: string;
  channelTitle: string;
  category: string;
  publishedAt: string;
  summary: string;
  bulletPoints: string[];
  locationName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  thumbnailUrl: string;
  youtubeUrl: string;
}

export interface SearchRuleViewModel {
  id: number;
  keyword: string;
  enabled: boolean;
  intervalMinutes: number;
  lastCheckedAt?: string;
}

export const MOCK_NEWS_ARTICLES: NewsArticleViewModel[] = [
  {
    id: 'art_1',
    title: '【速報】台風10号の最新進路 東京都心でも強い雨と強風の恐れ 交通機関に乱れも',
    channelTitle: '首都圏ニュースLIVE',
    category: '災害・交通',
    publishedAt: '2026-08-24 16:30',
    summary: '非常に強い台風10号が関東地方に接近しており、都心周辺でも警報級の大雨と暴風が予想されています。主要路線での遅延や運転見合わせが始まっています。',
    bulletPoints: [
      '都心部で最大瞬間風速 30m/s を観測',
      '山手線・中央線の一部区間で計画運休の可能性',
      '避難場所の早期確認と不要不急の外出自粛を呼びかけ'
    ],
    locationName: '東京駅周辺',
    address: '東京都千代田区丸の内1丁目',
    latitude: 35.6812,
    longitude: 139.7671,
    tags: ['台風10号', '交通影響', '警報発令'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://youtube.com/watch?v=mock_video_1'
  },
  {
    id: 'art_2',
    title: '渋谷駅前の大規模再開発事業 新都市型交流拠点「SHIBUYA NEXT」が今夏オープン',
    channelTitle: '東京都市トレンド報道',
    category: '経済・街づくり',
    publishedAt: '2026-08-24 14:15',
    summary: '渋谷駅西口エリアで建設が進んでいた複合高層ビルが完成し、最新AI技術を活用した次世代オフィスと大型商業施設の複合空間が公開されました。',
    bulletPoints: [
      '地上38階建て、延床面積約12万平方メートル',
      '環境配慮型エネルギーシステムを全面採用',
      '国際カンファレンスホールと最新デジタルアートスペースを併設'
    ],
    locationName: '渋谷駅西口',
    address: '東京都渋谷区道玄坂1丁目',
    latitude: 35.6580,
    longitude: 139.7016,
    tags: ['渋谷再開発', 'SHIBUYANEXT', '都市開発'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://youtube.com/watch?v=mock_video_2'
  },
  {
    id: 'art_3',
    title: '横須賀港で自律型海洋調査ドローンの実証実験に成功 海底地形探査を自動化',
    channelTitle: 'テクノロジー・フロントライン',
    category: 'IT・技術',
    publishedAt: '2026-08-24 11:00',
    summary: '海洋研究機関と民間企業が共同開発した完全自動航行ドローンが横須賀沖での長期海底モニタリング試験を成功させ、リアルタイム通信の安定性が証明されました。',
    bulletPoints: [
      'AIによる自律障害物回避アルゴリズムを搭載',
      '従来比3倍の精度で海底高解像度3Dマップを生成',
      'インフラ点検や港湾安全管理への活用を期待'
    ],
    locationName: '横須賀港',
    address: '神奈川県横須賀市新港町',
    latitude: 35.2815,
    longitude: 139.6722,
    tags: ['海洋ドローン', '自律航行', 'AI技術'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://youtube.com/watch?v=mock_video_3'
  }
];

export const MOCK_SEARCH_RULES: SearchRuleViewModel[] = [
  { id: 1, keyword: '台風 交通 影響', enabled: true, intervalMinutes: 15, lastCheckedAt: '16:30' },
  { id: 2, keyword: '再開発 都心', enabled: true, intervalMinutes: 30, lastCheckedAt: '14:15' },
  { id: 3, keyword: 'AI ドローン 実証実験', enabled: false, intervalMinutes: 60, lastCheckedAt: '11:00' }
];
