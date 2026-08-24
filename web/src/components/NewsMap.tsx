import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Layers, 
  Crosshair, 
  Flame, 
  Sparkles, 
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { NewsItem, NewsCategory } from '../types/news';

interface NewsMapProps {
  items: NewsItem[];
  selectedItem: NewsItem | null;
  onSelectItem: (item: NewsItem) => void;
  onOpenDetailModal: (item: NewsItem) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

const CATEGORY_MAP_STYLES: Record<NewsCategory, { color: string; bg: string; border: string; emoji: string }> = {
  all: { color: '#ef4444', bg: '#fee2e2', border: '#b91c1c', emoji: '📰' },
  accident: { color: '#dc2626', bg: '#fef2f2', border: '#991b1b', emoji: '🚨' },
  weather: { color: '#0284c7', bg: '#e0f2fe', border: '#0369a1', emoji: '🌦️' },
  politics: { color: '#7c3aed', bg: '#f5f3ff', border: '#6d28d9', emoji: '🏛️' },
  tech: { color: '#059669', bg: '#ecfdf5', border: '#047857', emoji: '🤖' },
  society: { color: '#ea580c', bg: '#fff7ed', border: '#c2410c', emoji: '🏢' },
  entertainment: { color: '#db2777', bg: '#fdf2f8', border: '#be185d', emoji: '🎭' },
  international: { color: '#4f46e5', bg: '#eef2ff', border: '#4338ca', emoji: '🌍' },
  local: { color: '#16a34a', bg: '#f0fdf4', border: '#15803d', emoji: '🗾' },
};

function createPinHtml(item: NewsItem, isSelected: boolean): string {
  const style = CATEGORY_MAP_STYLES[item.category] || CATEGORY_MAP_STYLES.all;
  const isBreaking = item.importance === 'breaking';
  const size = isSelected ? 42 : 34;

  return `
    <div class="custom-map-pin relative" style="width: ${size}px; height: ${size}px;">
      ${isBreaking ? `
        <div class="pulse-ring" style="background-color: ${style.color}; opacity: 0.35;"></div>
      ` : ''}
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${isSelected ? '#dc2626' : style.color};
        border: 2.5px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: ${isSelected ? '16px' : '13px'};
          line-height: 1;
        ">
          ${style.emoji}
        </span>
      </div>
      ${isBreaking ? `
        <span style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 9999px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 1px solid white;
        ">速報</span>
      ` : ''}
    </div>
  `;
}

export const NewsMap: React.FC<NewsMapProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onOpenDetailModal,
  isFullScreen,
  onToggleFullScreen,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard');

  const itemsWithLocation = items.filter(
    (item) => item.location && typeof item.location.lat === 'number' && typeof item.location.lng === 'number'
  );

  const tileUrls = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [36.2048, 138.2529],
        zoom: 6,
        zoomControl: true,
      });

      const initialTile = L.tileLayer(tileUrls.standard, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      tileLayerRef.current = initialTile;
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrls[mapLayer]);
    }
  }, [mapLayer]);

  // Handle Resize / invalidateSize
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    itemsWithLocation.forEach((item) => {
      if (!item.location) return;

      const isSelected = selectedItem?.id === item.id;
      const size = isSelected ? 42 : 34;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: createPinHtml(item, isSelected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });

      const marker = L.marker([item.location.lat, item.location.lng], { icon });

      // Create popup content
      const googleMapsUrl = item.location.googleMapsUrl || 
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location.address || `${item.location.lat},${item.location.lng}`)}`;

      const popupDiv = document.createElement('div');
      popupDiv.className = 'w-72 sm:w-80 p-3 text-slate-900';
      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
            ${item.channelName}
          </span>
          <span class="text-[10px] text-slate-500 font-medium">
            ${item.publishedAt}
          </span>
        </div>
        <h4 class="text-xs sm:text-sm font-bold leading-snug mb-1.5 hover:text-red-600 cursor-pointer line-clamp-2 title-btn">
          ${item.title}
        </h4>
        <div class="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-2">
          <span class="text-red-500 font-bold">📍</span>
          <div>
            <p class="font-bold text-slate-800 text-[11px]">
              ${item.location.spotName || `${item.location.prefecture} ${item.location.city}`}
            </p>
            <p class="text-[10px] text-slate-600">
              ${item.location.address}
            </p>
          </div>
        </div>
        <p class="text-[11px] text-slate-600 line-clamp-2 mb-2.5 leading-relaxed">
          ${item.summary}
        </p>
        <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <a
            href="${googleMapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Googleマップ
          </a>
          <button class="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 detail-btn transition-colors shadow-xs">
            詳細要約・動画
          </button>
        </div>
      `;

      popupDiv.querySelector('.detail-btn')?.addEventListener('click', () => {
        onOpenDetailModal(item);
      });

      popupDiv.querySelector('.title-btn')?.addEventListener('click', () => {
        onOpenDetailModal(item);
      });

      marker.bindPopup(popupDiv);

      marker.on('click', () => {
        onSelectItem(item);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [itemsWithLocation, selectedItem]);

  // Fly to selected item
  useEffect(() => {
    if (selectedItem?.location && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedItem.location.lat, selectedItem.location.lng],
        14,
        { duration: 1.2 }
      );
    }
  }, [selectedItem]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    if (itemsWithLocation.length > 1) {
      const bounds = L.latLngBounds(
        itemsWithLocation.map((i) => [i.location!.lat, i.location!.lng])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else {
      mapInstanceRef.current.setView([36.2048, 138.2529], 6);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col">
      
      {/* Top Floating Overlay Badge & Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <MapPin className="w-4 h-4 text-red-500" />
          <span>
            現場特定ニュース: <strong className="text-red-600 dark:text-red-400 font-bold">{itemsWithLocation.length}</strong> 件
          </span>
        </div>

        {/* Layer Switcher */}
        <button
          onClick={() => setMapLayer(mapLayer === 'standard' ? 'satellite' : 'standard')}
          className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="地図と航空写真の切り替え"
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>{mapLayer === 'standard' ? '航空写真' : '標準地図'}</span>
        </button>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          onClick={handleResetView}
          className="p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="日本全体に全体表示リセット"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            className="p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={isFullScreen ? '分割表示に戻す' : '全画面マップ表示'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />

      {/* Floating Bottom Help / Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1 font-medium">🚨 事件事故</span>
        <span className="flex items-center gap-1 font-medium">🌦️ 気象災害</span>
        <span className="flex items-center gap-1 font-medium">🏛️ 政治経済</span>
        <span className="flex items-center gap-1 font-medium">🤖 テック</span>
        <span className="flex items-center gap-1 font-medium">🗾 地域</span>
      </div>

    </div>
  );
};
