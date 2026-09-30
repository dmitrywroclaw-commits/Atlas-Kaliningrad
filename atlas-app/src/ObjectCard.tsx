import { ArrowUpRight, Info, MapPin, X } from 'lucide-react';
import { assetUrl, PlaceIcon, type Assets, type Media } from './AtlasMap';
import { placeTypeNames } from './places';
import { layers, type AtlasSettlement, type ThematicPlace } from './themes';

const statusNames: Record<string, string> = {
  ready_point: 'Точка объекта', rough_anchor: 'Ориентир населённого пункта',
  needs_georef: 'Требует геопривязки', area_required: 'Нужна геометрия района',
  research: 'Исследуется', cluster: 'Группа объектов',
};

export function Credits({ sources, media = [] }: { sources: { title: string; url: string }[]; media?: Media[] }) {
  return <details className="city-sources"><summary>Источники и изображения</summary><div>{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={13}/></a>)}{media.map(item => <div key={item.filename} className="media-credit"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.kind === 'photo' ? 'Фотография' : 'Герб'} · {item.author}<ArrowUpRight size={12}/></a><a className="license-link" href={item.licenseUrl} target="_blank" rel="noopener noreferrer">{item.license}</a><span>{item.kind === 'photo' ? 'Уменьшенная копия; кадрирование в превью.' : 'Исходный файл без изменений.'}</span></div>)}</div></details>;
}

export default function ObjectCard({ place, city, assets, close, focus }: { place: ThematicPlace; city: AtlasSettlement; assets: Assets; close: () => void; focus: () => void }) {
  const state = place.states.now;
  const photo = place.photoCityId ? assets[place.photoCityId]?.photo : undefined;
  const layer = layers.find(item => item.id === place.layer)!;
  return <section className="detail-card" aria-label={`Объект: ${state?.name}`}>
    <button className="detail-close icon-button" aria-label="Закрыть объект" onClick={close}><X size={19}/></button>
    {photo ? <div className="detail-photo"><img src={assetUrl(photo)} alt={photo.alt || state?.name}/><span className="photo-era">Современный вид</span></div> : <div className="detail-historical"><PlaceIcon place={place} size={65}/><span>{layer.title}</span></div>}
    <div className="detail-body"><div className="detail-type">{layer.title} · {placeTypeNames[place.kind]}</div><h2>{state?.name}</h2><div className="detail-latin">{city.name}{place.storyKind ? ` · ${place.storyKind}` : ''}</div><div className={`geo-status ${place.mapPrecision === 'anchor' ? 'is-anchor' : ''}`}>{statusNames[place.geoStatus] || place.geoStatus}{place.mapPrecision === 'anchor' && place.geoStatus === 'ready_point' ? ' · ориентир на карте' : ''}</div>
      <p className="detail-description">{state?.description}</p>
      {place.period && <div className="story-detail">{place.period}</div>}
      {place.geoNote && <div className="hidden-reason"><Info size={18}/><p>{place.geoNote}</p></div>}
      {place.locationHint && <p className="location-hint">Привязка в исследовании: {place.locationHint}</p>}
      {state?.date && <div className="date-note"><span/>{state.date}</div>}
      <button className="focus-city" onClick={focus}><MapPin size={17}/>Показать на карте<ArrowUpRight size={17}/></button>
      <Credits sources={place.sources} media={photo ? [photo] : []}/>
    </div>
  </section>;
}
