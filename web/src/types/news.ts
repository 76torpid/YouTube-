export type NewsCategory = 
  | 'all'
  | 'accident'
  | 'politics'
  | 'weather'
  | 'tech'
  | 'society'
  | 'entertainment'
  | 'international'
  | 'local';

export type ImportanceLevel = 'breaking' | 'high' | 'normal';

export interface NewsLocation {
  prefecture: string;
  city: string;
  address: string;
  spotName?: string;
  lat: number;
  lng: number;
  accuracy: 'exact' | 'city' | 'prefecture' | 'approximate';
  googleMapsUrl: string;
  mapDescription?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId?: string;
  thumbnailUrl?: string;
  channelName: string;
  publishedAt: string;
  category: NewsCategory;
  summary: string;
  bulletPoints: string[];
  keywords: string[];
  location: NewsLocation | null;
  importance: ImportanceLevel;
  isBookmarked?: boolean;
}

export interface KeywordPreset {
  id: string;
  name: string;
  icon?: string;
  keywords: string[];
  description?: string;
  category?: NewsCategory;
}

export interface SearchFilterState {
  keywords: string[];
  activeKeywords: string[];
  category: NewsCategory;
  timeRange: 'all' | 'today' | '24h' | '3days' | 'week';
  region: string;
  searchQuery: string;
  onlyWithLocation: boolean;
  importanceOnly: boolean;
  sortBy: 'latest' | 'importance' | 'location';
}

export type ViewMode = 'split' | 'list' | 'map' | 'grid';
