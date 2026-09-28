import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import * as maplibre from 'maplibre-gl';
import type { Map as LibreMap, StyleSpecification, CameraOptions } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Anchor, Building2, Castle, Church, Compass, Info, Landmark, MapPin, Maximize, Minus, Plus, Shield, Waves } from 'lucide-react';
import { getVisibleCities, type City, type EraId, type MarkerStyle } from './data';
import { getCityPlaces, type AtlasPlace } from './places';
import { publicUrl } from './urls';

maplibre.setWorkerUrl(workerUrl);
export type Media = { cityId: string; kind: string; filename: string; sourceUrl: string; author: string; license: string; licenseUrl: string; alt?: string; attribution?: string };
export type Assets = Record<string, { photo?: Media; coat?: Media }>;
export const assetUrl = (asset?: Media) => asset ? publicUrl(`media/${asset.filename}`) : undefined;
export function PlaceIcon({ place, size = 24 }: { place: AtlasPlace; size?: number }) {
  const Icon = place.kind === 'castle' ? Castle : place.kind === 'church' ? Church : place.kind === 'bridge' ? Waves : place.kind === 'quarter' ? Building2 : Landmark;
  return <Icon size={size} strokeWidth={1.5} />;
}
export function CityIcon({ city, era, size = 20 }: { city: City; era: EraId; size?: number }) {
  const Icon = city.states[era].type === 'castle' ? Castle : city.states[era].type === 'port' ? Anchor : Building2;
  return <Icon size={size} strokeWidth={1.5} />;
}
const regionBounds: [[number, number], [number, number]] = [[19.55, 54.30], [22.93, 55.30]];
const offsets: Record<string, [number, number]> = { sovetsk: [-25, -10], neman: [24, 28], zelenogradsk: [16, -8], svetlogorsk: [-20, -12] };
const mobileOffsets: Record<string, [number, number]> = { ...offsets, kaliningrad: [-6, -5], chernyakhovsk: [0, -10], gusev: [0, 25], baltiysk: [0, 15], zelenogradsk: [22, 8], svetlogorsk: [-20, -20], bagrationovsk: [0, 40], pravdinsk: [18, 6], gvardeysk: [0, 12] };

function CityMarker({ city, era, style, assets, narrow, select }: { city: City; era: EraId; style: MarkerStyle; assets: Assets; narrow: boolean; select: (id: string) => void }) {
  const [dx, dy] = style === 'compact' ? [0, 0] : (narrow ? mobileOffsets : offsets)[city.id] || [0, 0];
  const data = assets[city.id];
  return <>
    {(dx || dy) ? <svg className="marker-leader" aria-hidden="true"><line x1="0" y1="0" x2={dx} y2={dy} /><circle cx="0" cy="0" r="2.5" /></svg> : null}
    <button className={`atlas-marker ${style} ${era !== 'now' ? 'historical' : ''}`} style={{ left: dx, top: dy }} onClick={() => select(city.id)} aria-label={`Открыть карту: ${city.states[era].name}`} data-city={city.id}>
      {era === 'now' ? <span className="marker-picture">
        {style === 'coat' ? (data?.coat ? <img className="main-coat" src={assetUrl(data.coat)} alt="" /> : <Shield />) : (data?.photo ? <img className="city-photo" src={assetUrl(data.photo)} alt="" /> : <MapPin />)}
        {style !== 'coat' && data?.coat ? <span className="coat-badge"><img src={assetUrl(data.coat)} alt="" /></span> : null}
      </span> : <span className="marker-picture era-symbol"><CityIcon city={city} era={era} size={25} /></span>}
      <span className="marker-name">{city.states[era].name}</span>
    </button>
  </>;
}

function ObjectMarker({ place, era, assets, active, select }: { place: AtlasPlace; era: EraId; assets: Assets; active: boolean; select: (id: string) => void }) {
  const photo = era === 'now' && place.photoCityId ? assets[place.photoCityId]?.photo : undefined;
  return <button className={`atlas-marker photo object-marker ${active ? 'active' : ''} ${era !== 'now' ? 'historical' : ''}`} onClick={() => select(place.id)} aria-label={`Открыть объект: ${place.states[era]?.name}`} aria-pressed={active} data-place={place.id}>
    <span className="marker-picture era-symbol">{photo ? <img className="city-photo" src={assetUrl(photo)} alt="" /> : <PlaceIcon place={place} size={26} />}</span>
    <span className="marker-name">{place.states[era]?.name}</span>
  </button>;
}

type Props = { era: EraId; style: MarkerStyle; city?: City; placeId: string | null; assets: Assets; selectCity: (id: string) => void; selectPlace: (id: string) => void; mapRef: RefObject<LibreMap | null> };
export default function AtlasMap({ era, style, city, placeId, assets, selectCity, selectPlace, mapRef }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<LibreMap | null>(null);
  const [slots, setSlots] = useState<{ id: string; element: HTMLDivElement; city?: City; place?: AtlasPlace }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [narrow, setNarrow] = useState(window.innerWidth < 760);
  const region = useRef<any>(null);
  const base = useRef<StyleSpecification | null>(null);
  const fallback = useRef<StyleSpecification | null>(null);
  const regionCamera = useRef<(CameraOptions & { padding: maplibre.PaddingOptions }) | null>(null);
  const previousCity = useRef<string | null>(null);
  const current = useRef({ era, city });
  current.current = { era, city };
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700;
  const frame = useCallback((animate = true) => {
    const instance = mapRef.current;
    if (!instance) return;
    const activeCity = current.current.city;
    const padding = { top: activeCity ? 155 : 110, bottom: window.innerWidth < 760 ? 140 : 150, left: window.innerWidth < 760 ? 50 : 70, right: window.innerWidth < 760 ? 50 : 70 };
    if (!activeCity) { instance.fitBounds(regionBounds, { padding, duration: animate ? duration() : 0 }); return; }
    const objects = getCityPlaces(activeCity.id, current.current.era);
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
        if (result.ok) { base.current = await result.json(); if (!disposed) instance.setStyle(makeStyle(base.current!, region.current, current.current.era, !!current.current.city)); }
      } catch (err) {
        if (!disposed && !(err instanceof DOMException && err.name === 'AbortError')) { setLoading(false); setError('Не удалось открыть карту. Места доступны в списке.'); }
      }
    }
    void init();
    return () => { disposed = true; controller.abort(); instance?.remove(); mapRef.current = null; };
  }, [mapRef]);

  useEffect(() => {
    if (!map) return;
    const items: { id: string; coordinates: [number, number]; city?: City; place?: AtlasPlace }[] = city ? getCityPlaces(city.id, era).map(place => ({ id: place.id, coordinates: place.coordinates, place })) : getVisibleCities(era).map(item => ({ id: item.id, coordinates: item.states[era].coordinates || item.coordinates, city: item }));
    const markers = items.map(item => { const element = document.createElement('div'); element.className = 'marker-anchor'; const marker = new maplibre.Marker({ element, anchor: 'center' }).setLngLat(item.coordinates).addTo(map); return { ...item, element, marker }; });
    setSlots(markers);
    if (base.current) map.setStyle(makeStyle(base.current, region.current, era, !!city));
    return () => markers.forEach(item => item.marker.remove());
  }, [map, era, city]);

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
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    const observer = new ResizeObserver(() => map?.resize());
    if (container.current) observer.observe(container.current);
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, [map]);

  return <>
    <div ref={container} className="map-canvas" aria-label={city ? `Карта города: ${city.states[era].name}` : 'Интерактивная карта Калининградской области'} />
    {slots.map(slot => createPortal(slot.place ? <ObjectMarker place={slot.place} era={era} assets={assets} active={placeId === slot.id} select={selectPlace} /> : <CityMarker city={slot.city!} era={era} style={style} assets={assets} narrow={narrow} select={selectCity} />, slot.element, slot.id))}
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
