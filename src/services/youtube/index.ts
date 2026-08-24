export interface NormalizedVideo {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  publishedAt: string;
  youtubeUrl: string;
  thumbnailUrl: string;
}

export interface YouTubeSearchResult {
  items: Array<{
    id: { videoId: string };
    snippet: {
      publishedAt: string;
      channelId: string;
      title: string;
      description: string;
      thumbnails?: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
      channelTitle: string;
    };
  }>;
}

export interface YouTubeCategoryResult {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      assignable: boolean;
    };
  }>;
}

export const JAPAN_NEWS_CATEGORY_ID = '25'; // News & Politics (ニュースと政治) in JP region

export class YouTubeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideos(keyword: string, publishedAfterIso?: string): Promise<NormalizedVideo[]> {
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is missing');
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      order: 'date',
      regionCode: 'JP',
      relevanceLanguage: 'ja',
      videoCategoryId: JAPAN_NEWS_CATEGORY_ID,
      q: keyword,
      maxResults: '10',
      key: this.apiKey
    });

    if (publishedAfterIso) {
      params.append('publishedAfter', publishedAfterIso);
    }

    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`YouTube API error (${res.status}): ${errText}`);
    }

    const data: YouTubeSearchResult = await res.json();
    return (data.items || [])
      .filter((item) => item.id && item.id.videoId)
      .map((item) => {
        const snippet = item.snippet;
        const thumb =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          '';

        return {
          videoId: item.id.videoId,
          channelId: snippet.channelId,
          channelTitle: snippet.channelTitle,
          title: snippet.title,
          description: snippet.description,
          publishedAt: snippet.publishedAt,
          youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnailUrl: thumb
        };
      });
  }

  async getCategoryName(categoryId: string = JAPAN_NEWS_CATEGORY_ID): Promise<string> {
    const params = new URLSearchParams({
      part: 'snippet',
      regionCode: 'JP',
      hl: 'ja',
      key: this.apiKey
    });

    const url = `https://www.googleapis.com/youtube/v3/videoCategories?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return 'ニュースと政治';

    const data: YouTubeCategoryResult = await res.json();
    const found = (data.items || []).find((c) => c.id === categoryId);
    return found ? found.snippet.title : 'ニュースと政治';
  }
}
