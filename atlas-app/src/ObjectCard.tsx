import { ArrowUpRight, Info, MapPin, RotateCcw, X } from 'lucide-react';
import { assetUrl, PlaceIcon, type Assets, type Media } from './AtlasMap';
import { eras, type City, type EraId } from './data';
import { placeTypeNames, type AtlasPlace } from './places';

export function Credits({ sources, media = [] }: { sources: { title: string; url: string }[]; media?: Media[] }) {
  return <details className="city-sources"><summary>Источники и изображения</summary><div>{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={13}/></a>)}{media.map(item => <div key={item.filename} className="media-credit"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.kind === 'photo' ? 'Фотография' : 'Герб'} · {item.author}<ArrowUpRight size={12}/></a><a className="license-link" href={item.licenseUrl} target="_blank" rel="noopener noreferrer">{item.license}</a><span>{item.kind === 'photo' ? 'Уменьшенная копия; кадрирование в превью.' : 'Исходный файл без изменений.'}</span></div>)}</div></details>;
}

export default function ObjectCard({ place, city, era, assets, close, focus, showNow }: { place: AtlasPlace; city: City; era: EraId; assets: Assets; close: () => void; focus: () => void; showNow: () => void }) {
  const state = place.states[era];
  const photo = era === 'now' && place.photoCityId ? assets[place.photoCityId]?.photo : undefined;
  const currentEra = eras.find(item => item.id === era)!;
  return <section className="detail-card" aria-label={`Объект: ${state?.name || place.states.now?.name}`}>
    <button className="detail-close icon-button" aria-label="Закрыть объект" onClick={close}><X size={19}/></button>
    {photo ? <div className="detail-photo"><img src={assetUrl(photo)} alt={photo.alt || state?.name}/><span className="photo-era">Современный вид</span></div> : <div className="detail-historical"><PlaceIcon place={place} size={65}/><span>{currentEra.period}</span></div>}
    <div className="detail-body"><div className="detail-type">{placeTypeNames[place.kind]}</div><h2>{state?.name || place.states.now?.name}</h2><div className="detail-latin">{city.states[era].name} · {currentEra.title}</div>
      {state ? <><p className="detail-description">{state.description}</p>{state.date && <div className="date-note"><span/>{state.date}</div>}<button className="focus-city" onClick={focus}><MapPin size={17}/>Показать на карте<ArrowUpRight size={17}/></button></> : <><div className="hidden-reason"><Info size={18}/><p>{place.absentReason || 'Этот объект относится к более позднему времени и не показан на карте выбранной эпохи.'}</p></div><button className="focus-city" onClick={showNow}><RotateCcw size={17}/>Показать в наши дни</button></>}
      <Credits sources={place.sources} media={photo ? [photo] : []}/>
    </div>
  </section>;
}
