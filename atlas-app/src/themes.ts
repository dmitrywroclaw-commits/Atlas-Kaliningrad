import research from './research-data.json';
import { cities as originalCities } from './data';
import { places, type AtlasPlace, type PlaceKind } from './places';
import { publicUrl } from './urls';

export type LayerId = 'places' | 'russian' | 'ww2' | 'folklore' | 'literature';
export type MapPrecision = 'point' | 'anchor';
export interface AtlasSettlement {
  id: string;
  name: string;
  historicalName: string;
  coordinates: [number, number];
  description: string;
  geoStatus: string;
  sources: { title: string; url: string }[];
}
export type ThematicPlace = AtlasPlace & {
  layer: LayerId;
  mapPrecision: MapPrecision;
  geoStatus: string;
  kindLabel?: string;
  period?: string;
  locationHint?: string;
  document?: string;
  storyKind?: string;
  geoNote?: string;
};

export const layers: { id: LayerId; title: string; short: string; description: string; accent: string }[] = [
  { id: 'places', title: 'Места', short: 'Города и посёлки', description: '26 населённых пунктов исследовательского списка. Выберите место, чтобы увидеть связанные с ним точки всех тем.', accent: '#b28b52' },
  { id: 'russian', title: 'Русская история', short: 'До 1917 года', description: '15 мест сражений, мемориалов и музеев российской военной истории до 1917 года.', accent: '#637e8b' },
  { id: 'ww2', title: 'Великая Отечественная', short: '1945 год', description: '16 мест боёв, штабов, памятников и музеев Восточно-Прусской операции.', accent: '#9a675c' },
  { id: 'folklore', title: 'Фольклор', short: 'Легенды и сюжеты', description: '15 записей о мифах, местных преданиях и современном городском фольклоре.', accent: '#8b7898' },
  { id: 'literature', title: 'Литература', short: 'Авторы и книги', description: '12 мест, связанных с жизнью писателей, произведениями и литературной памятью.', accent: '#68866c' },
];

const source = (filename: string) => [{ title: 'Исследовательский список этапа 2 · источники внутри документа', url: publicUrl(`research/${filename}`) }];
export const settlements: AtlasSettlement[] = research.settlements.map(item => {
  const original = originalCities.find(city => city.id === item.id);
  return {
    id: item.id, name: item.name, historicalName: item.historicalName,
    coordinates: item.coordinates as [number, number],
    description: item.description, geoStatus: item.geoStatus,
    sources: [...(original?.sources || []), ...source(item.document)],
  };
});

function placeKind(kind: string, layer: LayerId): PlaceKind {
  if (layer === 'folklore') return 'story';
  if (/battle|assault|area|field/i.test(kind)) return 'battlefield';
  if (/route/i.test(kind)) return 'route';
  if (/museum|institution/i.test(kind)) return 'museum';
  if (/memorial|grave/i.test(kind)) return 'monument';
  if (/command|planning/i.test(kind)) return 'building';
  if (/fort/i.test(kind)) return 'fortification';
  return layer === 'literature' ? 'building' : 'monument';
}
function storyKind(layer: LayerId, kind: string) {
  if (layer === 'folklore') return /hypothesis/i.test(kind) ? 'Гипотеза' : /modern|urban/i.test(kind) ? 'Городской фольклор' : 'Легенда';
  if (/memorial|grave/i.test(kind)) return 'Память';
  return 'Исторический материал';
}

const researchPlaces: ThematicPlace[] = research.records.map(item => {
  const layer = item.layer as LayerId;
  const precision = item.mapPrecision as MapPrecision;
  return {
    id: item.id, cityId: item.cityId, coordinates: item.coordinates as [number, number],
    kind: placeKind(item.kind, layer), layer, mapPrecision: precision,
    geoStatus: item.geoStatus, kindLabel: item.kind, period: item.period,
    locationHint: item.locationHint, document: item.document,
    storyKind: storyKind(layer, item.kind),
    states: { now: { name: item.name, description: item.description } },
    sources: source(item.document),
    geoNote: precision === 'anchor'
      ? 'На карте показан ориентир района или населённого пункта. Точное положение этого сюжета ещё требует геопривязки.'
      : undefined,
  };
});

export const allPlaces: ThematicPlace[] = [
  ...settlements.map(city => ({
    id: `settlement-${city.id}`, cityId: city.id, coordinates: city.coordinates,
    kind: 'building' as const, layer: 'places' as const,
    mapPrecision: 'anchor' as const, geoStatus: city.geoStatus,
    storyKind: 'Населённый пункт',
    states: { now: { name: city.name, description: city.description } },
    sources: city.sources,
    geoNote: 'Маркер показывает черновой центр населённого пункта из исследовательского списка, а не координаты отдельной достопримечательности.',
  })),
  ...places.map(place => ({ ...place, layer: 'places' as const, mapPrecision: 'point' as const, geoStatus: 'ready_point', storyKind: 'Исторический объект' })),
  ...researchPlaces,
];
export const getCityPoints = (cityId: string) => allPlaces.filter(place => place.cityId === cityId);
export const getLayerPoints = (layer: LayerId) => allPlaces.filter(place => place.layer === layer);
export function parseLayer(search: string): LayerId {
  const value = new URLSearchParams(search).get('layer');
  return layers.some(layer => layer.id === value) ? value as LayerId : 'places';
}
export function parseCity(search: string): string | null {
  const value = new URLSearchParams(search).get('city');
  return settlements.some(city => city.id === value) ? value : null;
}
