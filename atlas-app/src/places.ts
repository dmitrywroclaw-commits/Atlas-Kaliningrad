import placeData from './places-data.json';
import type { EraId } from './data';

export type PlaceKind = 'castle' | 'church' | 'bridge' | 'quarter' | 'museum' | 'tower' | 'monument' | 'building' | 'fortification' | 'battlefield' | 'route' | 'story';
export interface AtlasPlace {
  id: string;
  cityId: string;
  coordinates: [number, number];
  kind: PlaceKind;
  states: Partial<Record<EraId, { name: string; description: string; date?: string }>>;
  photoCityId?: string;
  absentReason?: string;
  sources: { title: string; url: string }[];
}
export const placeTypeNames: Record<PlaceKind, string> = {
  castle: 'Замок и крепость', church: 'Храм', bridge: 'Мост', quarter: 'Городской квартал',
  museum: 'Музей', tower: 'Башня', monument: 'Памятное место', building: 'Историческое здание', fortification: 'Городские укрепления',
  battlefield: 'Район события', route: 'Маршрут', story: 'Место рассказа',
};
export const places = placeData as AtlasPlace[];
export function getCityPlaces(cityId: string, era: EraId) {
  return places.filter(place => place.cityId === cityId && place.states[era]);
}
