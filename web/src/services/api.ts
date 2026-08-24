import { NewsItem, SearchFilterState } from '../types/news';

export async function fetchYouTubeNews(_filters: Partial<SearchFilterState>): Promise<{
  items: NewsItem[];
  timestamp: string;
  query: unknown;
}> {
  try {
    const res = await fetch('/api/articles');
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    const data = await res.json();
    const articles = data.articles || [];

    const items: NewsItem[] = articles.map((art: {
      id: string;
      title: string;
      channelTitle: string;
      category?: string;
      publishedAt: string;
      summary: string;
      bulletPoints?: string[];
      locationName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      tags?: string[];
      thumbnailUrl: string;
      youtubeUrl: string;
    }) => {
      const hasLoc = Boolean(art.locationName && art.latitude && art.longitude);

      return {
        id: art.id,
        videoId: art.id,
        title: art.title,
        youtubeUrl: art.youtubeUrl,
        thumbnailUrl: art.thumbnailUrl,
        channelName: art.channelTitle,
        publishedAt: art.publishedAt,
        category: 'politics', // News & Politics
        summary: art.summary,
        bulletPoints: art.bulletPoints || [
          `動画ID: ${art.id}`,
          `配信元: ${art.channelTitle}`,
          `情報ソース: youtube_metadata`
        ],
        keywords: art.tags || ['YouTube', '最新ニュース'],
        location: hasLoc
          ? {
              prefecture: '日本',
              city: art.locationName || '',
              address: art.address || art.locationName || '',
              spotName: art.locationName,
              lat: art.latitude!,
              lng: art.longitude!,
              accuracy: 'exact',
              googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                art.address || art.locationName || ''
              )}`
            }
          : null,
        importance: 'normal'
      };
    });

    return {
      items,
      timestamp: new Date().toISOString(),
      query: {}
    };
  } catch (error) {
    console.error('Fetch YouTube News error:', error);
    throw error;
  }
}

export async function analyzeNewsLocation(_title: string, _summary: string, _channelName?: string) {
  return null;
}
