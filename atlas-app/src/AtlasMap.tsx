import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import * as maplibre from 'maplibre-gl';
import type { Map as LibreMap, StyleSpecification, CameraOptions } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Anchor, Building2, Castle, Church, Compass, Info, Landmark, MapPin, Maximize, Minus, Plus, Waves } from 'lucide-react';
import type { City, EraId } from './data';
import type { AtlasPlace } from './places';
import { getCityPoints, getLayerPoints, settlements, type AtlasSettlement, type LayerId, type ThematicPlace } from './themes';
import { publicUrl } from './urls';

maplibre.setWorkerUrl(workerUrl);
export type Media = { cityId: string; kind: string; filename: string; sourceUrl: string; author: string; license: string; licenseUrl: string; alt?: string; attribution?: string };
export type Assets = Record<string, { photo?: Media; coat?: Media }>;
export const assetUrl = (asset?: Media) => asset ? publicUrl(`media/${asset.filename}`) : undefined;
export function PlaceIcon({ place, size = 24 }: { place: AtlasPlace; size?: number }) {
  const Icon = place.kind === 'castle' ? Castle : place.kind === 'church' ? Church : place.kind === 'bridge' ? Waves : place.kind === 'quarter' ? Building2 : place.kind === 'battlefield' ? Compass : place.kind === 'route' ? MapPin : place.kind === 'story' ? Info : Landmark;
  return <Icon size={size} strokeWidth={1.5} />;
}
export function CityIcon({ city, era, size = 20 }: { city: City; era: EraId; size?: number }) {
  const Icon = city.states[era].type === 'castle' ? Castle : city.states[era].type === 'port' ? Anchor : Building2;
  return <Icon size={size} strokeWidth={1.5} />;
}
const regionBounds: [[number, number], [number, number]] = [[19.55, 54.30], [22.93, 55.30]];
type MapItem = { id: string; coordinates: [number, number]; city?: AtlasSettlement; place?: ThematicPlace };
function markerOffsets(items: MapItem[]): Map<string, [number, number]> {
  const groups = new Map<string, MapItem[]>();
  for (const item of items) {
    if (!item.place) continue;
    const key = item.place.mapPrecision === 'anchor'
      ? `anchor:${item.place.cityId}`
      : `point:${item.coordinates[0].toFixed(5)}:${item.coordinates[1].toFixed(5)}`;
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  const offsets = new Map<string, [number, number]>();
  for (const group of groups.values()) group.forEach((item, index) => {
    if (group.length === 1) { offsets.set(item.id, [0, 0]); return; }
    const ring = Math.floor(index / 8);
    const count = Math.min(8, group.length - ring * 8);
    const angle = (index % 8) * 2 * Math.PI / count - Math.PI / 2;
    const radius = 19 + ring * 17;
    offsets.set(item.id, [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)]);
  });
  return offsets;
}

function CityMarker({ city, assets, select }: { city: AtlasSettlement; assets: Assets; select: (id: string) => void }) {
  const data = assets[city.id];
  return <button className="atlas-marker photo region-point settlement-point" onClick={() => select(city.id)} aria-label={`Открыть карту: ${city.name}`} data-city={city.id}>
      <span className="marker-picture">
        <img className="city-photo" src={assetUrl(data?.photo) || publicUrl('media/place-preview.svg')} alt="" />
      </span>
      <span className="marker-name">{city.name}</span>
    </button>;
}

function ObjectMarker({ place, assets, active, regionView, offset, select }: { place: ThematicPlace; assets: Assets; active: boolean; regionView: boolean; offset: [number, number]; select: (id: string) => void }) {
  const photo = place.photoCityId ? assets[place.photoCityId]?.photo : assets[place.cityId]?.photo;
  const compact = regionView || place.mapPrecision === 'anchor';
  return <button className={`atlas-marker photo object-marker theme-${place.layer} ${compact ? 'map-dot' : ''} ${place.mapPrecision === 'anchor' ? 'approximate' : ''} ${active ? 'active' : ''}`} style={{ left: offset[0], top: offset[1] }} onClick={() => select(place.id)} aria-label={`Открыть объект: ${place.states.now?.name}${place.mapPrecision === 'anchor' ? ', ориентир' : ''}`} aria-pressed={active} data-place={place.id}>
    <span className="marker-picture era-symbol"><img className="city-photo" src={assetUrl(photo) || publicUrl('media/place-preview.svg')} alt="" /></span>
    <span className="marker-name">{place.states.now?.name}{place.mapPrecision === 'anchor' ? ' · ориентир' : ''}</span>
  </button>;
}

type Props = { layer: LayerId; city?: AtlasSettlement; placeId: string | null; assets: Assets; selectCity: (id: string) => void; selectPlace: (id: string) => void; mapRef: RefObject<LibreMap | null> };
export default function AtlasMap({ layer, city, placeId, assets, selectCity, selectPlace, mapRef }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<LibreMap | null>(null);
  const [slots, setSlots] = useState<{ id: string; element: HTMLDivElement; city?: AtlasSettlement; place?: ThematicPlace; offset: [number, number] }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const region = useRef<any>(null);
  const base = useRef<StyleSpecification | null>(null);
  const fallback = useRef<StyleSpecification | null>(null);
  const regionCamera = useRef<(CameraOptions & { padding: maplibre.PaddingOptions }) | null>(null);
  const previousCity = useRef<string | null>(null);
  const current = useRef({ city });
  current.current = { city };
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700;
  const frame = useCallback((animate = true) => {
    const instance = mapRef.current;
    if (!instance) return;
    const activeCity = current.current.city;
    const padding = { top: activeCity ? 155 : 110, bottom: window.innerWidth < 760 ? 140 : 150, left: window.innerWidth < 760 ? 50 : 70, right: window.innerWidth < 760 ? 50 : 70 };
    if (!activeCity) { instance.fitBounds(regionBounds, { padding, duration: animate ? duration() : 0 }); return; }
    const objects = getCityPoints(activeCity.id);
    if (objects.length <= 1) { instance.flyTo({ center: objects[0]?.coordinates || activeCity.coordinates, zoom: 14, padding, duration: animate ? duration() : 0 }); return; }
    const bounds = new maplibre.LngLatBounds();
    objects.forEach(place => bounds.extend(place.coordinates));
    instance.fitBounds(bounds, { padding, maxZoom: 14, duration: animate ? duration() : 0 });
  }, [mapRef]);

  useEffect(() => {
    let disposed = false;
    let instance: LibreMap | null = null;
    const controller = new AbortController();
    async function init() {
      try {
        const response = await fetch(publicUrl('data/region.geojson'), { signal: controller.signal });
        if (!response.ok) throw new Error('boundary');
        region.current = await response.json();
        if (disposed) return;
        fallback.current = { version: 8, sources: { region: { type: 'geojson', data: region.current, attribution: '© <a href="https://www.geoboundaries.org/">geoBoundaries</a> / <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } }, layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#d8e6e6' } },
          { id: 'region-fill', type: 'fill', source: 'region', paint: { 'fill-color': '#f2f0e9' } },
          { id: 'region-border', type: 'line', source: 'region', paint: { 'line-color': '#92764e', 'line-width': 1.5, 'line-dasharray': [5, 3] } },
        ] };
        instance = new maplibre.Map({ container: container.current!, style: fallback.current, center: [21.2, 54.8], zoom: 7.2, minZoom: 5, maxZoom: 18, maxBounds: [[14, 48], [30, 61]], attributionControl: false, pitchWithRotate: false, dragRotate: false, touchPitch: false });
        instance.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right');
        instance.touchZoomRotate.disableRotation();
        // A geographic marker moves with the map instead of with the viewport.
        const sea = document.createElement('div');
        sea.className = 'geographic-label-anchor';
        sea.setAttribute('aria-hidden', 'true');
        const text = document.createElement('div');
        text.className = 'sea-label';
        text.textContent = 'БАЛТИЙСКОЕ\nМОРЕ';
        sea.appendChild(text);
        new maplibre.Marker({ element: sea, anchor: 'center' }).setLngLat([19.55, 55.10]).addTo(instance);
        mapRef.current = instance;
        setMap(instance);
        instance.on('sourcedata', event => { if (!disposed && event.sourceId === 'region' && event.isSourceLoaded) setLoading(false); });
        let errors = 0;
        instance.on('error', () => {
          if (!disposed && ++errors >= 3 && base.current) { base.current = null; instance?.setStyle(fallback.current!); setLoading(false); setError('Подложка недоступна. Координаты мест остаются на карте.'); }
        });
        const result = await fetch(publicUrl('data/basemap.json'), { signal: controller.signal });
        if (result.ok) { base.current = await result.json(); if (!disposed) instance.setStyle(makeStyle(base.current!, region.current, 'now', !!current.current.city)); }
      } catch (err) {
        if (!disposed && !(err instanceof DOMException && err.name === 'AbortError')) { setLoading(false); setError('Не удалось открыть карту. Места доступны в списке.'); }
      }
    }
    void init();
    return () => { disposed = true; controller.abort(); instance?.remove(); mapRef.current = null; };
  }, [mapRef]);

  useEffect(() => {
    if (!map) return;
    const items: MapItem[] = city ? getCityPoints(city.id).map(place => ({ id: place.id, coordinates: place.coordinates, place })) : layer === 'places' ? settlements.map(item => ({ id: item.id, coordinates: item.coordinates, city: item })) : getLayerPoints(layer).map(place => ({ id: place.id, coordinates: place.coordinates, place }));
    const offsets = markerOffsets(items);
    const markers = items.map(item => { const element = document.createElement('div'); element.className = 'marker-anchor'; const marker = new maplibre.Marker({ element, anchor: 'center' }).setLngLat(item.coordinates).addTo(map); return { ...item, element, offset: offsets.get(item.id) || [0, 0] as [number, number], marker }; });
    setSlots(markers);
    if (base.current) map.setStyle(makeStyle(base.current, region.current, 'now', !!city));
    return () => markers.forEach(item => item.marker.remove());
  }, [map, layer, city]);

  useEffect(() => {
    if (!map) return;
    if (city) {
      if (!previousCity.current) regionCamera.current = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch(), padding: map.getPadding() };
      frame(true);
    } else if (previousCity.current && regionCamera.current) {
      map.easeTo({ ...regionCamera.current, duration: duration() });
    } else frame(false);
    previousCity.current = city?.id || null;
  }, [map, city, frame]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    const update = () => map?.resize();
    media.addEventListener('change', update);
    const observer = new ResizeObserver(() => map?.resize());
    if (container.current) observer.observe(container.current);
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, [map]);

  return <>
    <div ref={container} className="map-canvas" aria-label={city ? `Карта города: ${city.name}` : 'Интерактивная карта Калининградской области'} />
    {slots.map(slot => createPortal(slot.place ? <ObjectMarker place={slot.place} assets={assets} active={placeId === slot.id} regionView={!city} offset={slot.offset} select={selectPlace} /> : <CityMarker city={slot.city!} assets={assets} select={selectCity} />, slot.element, slot.id))}
    {loading && <div className="map-message" role="status">Открываем карту…</div>}
    {error && <div className="map-message error" role="status"><Info size={16} />{error}</div>}
    <div className="map-controls"><button aria-label="Приблизить карту" onClick={() => map?.zoomIn()}><Plus size={20}/></button><button aria-label="Отдалить карту" onClick={() => map?.zoomOut()}><Minus size={20}/></button><span/><button aria-label={city ? 'Показать все объекты города' : 'Показать всю область'} onClick={() => frame()}><Maximize size={18}/></button></div>
    <div className="map-compass" aria-hidden="true"><span>С</span><Compass size={38} strokeWidth={1}/></div>
  </>;
}

function makeStyle(base: StyleSpecification, region: any, era: EraId, cityView: boolean): StyleSpecification {
  const result = structuredClone(base);
  const history = era !== 'now';
  result.layers = result.layers.filter(layer => (layer.type !== 'symbol' || (cityView && !history && layer.id.startsWith('highway-name'))) && !layer.id.startsWith('boundary'));
  delete result.sprite;
  if (!cityView || history) delete result.glyphs;
  result.layers = result.layers.filter(layer => !history || !/road|highway|railway|aeroway|tunnel|building|residential/.test(layer.id));
  for (const layer of result.layers) {
    if (layer.type === 'background') layer.paint = { 'background-color': history ? '#eee9dc' : '#f2f2ec' };
    if (layer.id === 'water' && layer.type === 'fill') layer.paint = { 'fill-color': history ? '#cad9d7' : '#cadfe2' };
    if (layer.id === 'landcover_wood' && layer.type === 'fill') layer.paint = { 'fill-color': history ? '#c8cbb3' : '#cad7c4', 'fill-opacity': .4 };
  }
  result.sources.region = { type: 'geojson', data: region, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://www.geoboundaries.org/">geoBoundaries</a>' };
  result.layers.push({ id: 'region-border', type: 'line', source: 'region', paint: { 'line-color': history ? '#917041' : '#6c7770', 'line-width': 1.4, 'line-dasharray': [5, 3] } });
  return result;
}
