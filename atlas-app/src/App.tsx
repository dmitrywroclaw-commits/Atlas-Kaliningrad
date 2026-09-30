import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, ChevronRight, Compass, Layers, List, MapPin, X } from 'lucide-react';
import type { Map as LibreMap } from 'maplibre-gl';
import AtlasMap, { assetUrl, PlaceIcon, type Assets, type Media } from './AtlasMap';
import ObjectCard, { Credits } from './ObjectCard';
import { placeTypeNames } from './places';
import { allPlaces, getCityPoints, getLayerPoints, layers, parseCity, parseLayer, settlements, type LayerId } from './themes';
import { publicUrl } from './urls';

const initialCity = parseCity(window.location.search);
const initialLayer = parseLayer(window.location.search);
function validPlace(search: string, cityId: string | null) {
  const id = new URLSearchParams(search).get('place');
  return allPlaces.some(place => place.id === id && place.cityId === cityId) ? id : null;
}

export default function App() {
  const [layer, setLayer] = useState<LayerId>(initialLayer);
  const [selected, setSelected] = useState<string | null>(initialCity);
  const [placeId, setPlaceId] = useState<string | null>(validPlace(window.location.search, initialCity));
  const [assets, setAssets] = useState<Assets>({});
  const [registry, setRegistry] = useState<Media[]>([]);
  const [about, setAbout] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const mapRef = useRef<LibreMap | null>(null);
  const closeAbout = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const city = settlements.find(item => item.id === selected);
  const place = allPlaces.find(item => item.id === placeId && item.cityId === selected);
  const currentLayer = layers.find(item => item.id === layer)!;
  const cityPoints = city ? getCityPoints(city.id) : [];
  const regionalCount = layer === 'places' ? settlements.length : getLayerPoints(layer).length;

  const navigate = useCallback((cityId: string | null, objectId: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (cityId) params.set('city', cityId); else params.delete('city');
    if (objectId) params.set('place', objectId); else params.delete('place');
    const url = `${window.location.pathname}?${params}`;
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, '', url);
    setSelected(cityId); setPlaceId(objectId); setListOpen(false);
  }, []);
  const selectCity = useCallback((id: string) => navigate(id, null), [navigate]);
  const selectPlace = useCallback((id: string) => { const item = allPlaces.find(p => p.id === id); if (item) navigate(item.cityId, id); }, [navigate]);
  const backToRegion = useCallback(() => navigate(null, null), [navigate]);
  const changeLayer = (id: LayerId) => { setLayer(id); navigate(null, null); };

  useEffect(() => {
    const controller = new AbortController();
    fetch(publicUrl('media/registry.json'), { signal: controller.signal }).then(response => response.ok ? response.json() : []).then((all: Media[]) => {
      setRegistry(all);
      const result: Assets = {};
      all.forEach(item => { result[item.cityId] ||= {}; if (item.kind === 'photo') result[item.cityId].photo = item; else result[item.cityId].coat = item; });
      setAssets(result);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('layer', layer); params.delete('era');
    if (selected) params.set('city', selected); else params.delete('city');
    if (placeId) params.set('place', placeId); else params.delete('place');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
    document.title = `${place?.states.now?.name || city?.name || currentLayer.title} — Атлас Калининградской области`;
  }, [layer, selected, placeId, city, place, currentLayer]);
  useEffect(() => {
    const handle = () => { const nextCity = parseCity(window.location.search); setLayer(parseLayer(window.location.search)); setSelected(nextCity); setPlaceId(validPlace(window.location.search, nextCity)); setListOpen(false); };
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (about) setAbout(false); else if (listOpen) setListOpen(false); else if (placeId) navigate(selected, null); else if (selected) backToRegion(); }
      if (about && event.key === 'Tab' && dialog.current) {
        const items = [...dialog.current.querySelectorAll<HTMLElement>('button, a[href]')];
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
        else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
      }
    };
    window.addEventListener('keydown', handler);
    if (about) closeAbout.current?.focus();
    return () => window.removeEventListener('keydown', handler);
  }, [about, selected, placeId, listOpen, navigate, backToRegion]);

  function focusPlace() {
    if (!place) return;
    mapRef.current?.flyTo({ center: place.coordinates, zoom: place.mapPrecision === 'anchor' ? 13 : 16, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700, padding: { top: 145, bottom: window.innerWidth < 760 ? 290 : 110, left: 40, right: window.innerWidth < 760 ? 40 : 360 } });
  }
  return <div className={`atlas-app layer-${layer} ${city ? 'city-view' : 'region-view'}`} style={{ '--layer-accent': currentLayer.accent } as CSSProperties}>
    <header className="header"><div className="brand"><span className="brand-mark"><Compass size={30} strokeWidth={1.2}/></span><div><span className="brand-kicker">Атлас мест и историй</span><h1>Калининградская область</h1></div></div><button className="about-button" aria-label="Об атласе и источники" onClick={() => setAbout(true)}><BookOpen size={18}/><span>Об атласе и источники</span></button></header>
    <main className="workspace">
      <aside className={`sidebar ${listOpen ? 'mobile-open' : ''}`} aria-label={city ? 'Интересные места города' : 'Места выбранного слоя'}>
        <div className="sidebar-intro">
          {city && <button className="sidebar-back" onClick={backToRegion}><ArrowLeft size={16}/>Карта области</button>}
          <span className="eyebrow">{city ? 'Все интересные места' : currentLayer.short}</span>
          <div className="sidebar-title"><h2>{city ? city.name : currentLayer.title}</h2><button className="mobile-close icon-button" aria-label="Закрыть список" onClick={() => setListOpen(false)}><X size={20}/></button></div>
          <p>{city ? city.description : currentLayer.description}</p>
        </div>
        <div className="city-list">
          <div className="list-label"><span>{city ? 'Точки на карте города' : layer === 'places' ? 'Города' : 'Точки на карте области'}</span><span>{String(city ? cityPoints.length : regionalCount).padStart(2,'0')}</span></div>
          {city ? cityPoints.map((item,index) => <button key={item.id} className={`city-row object-row ${placeId === item.id ? 'selected' : ''}`} onClick={() => selectPlace(item.id)} aria-pressed={placeId === item.id}><span className="city-number">{String(index+1).padStart(2,'0')}</span><span className="row-emblem object-row-icon"><PlaceIcon place={item} size={20}/></span><span className="row-titles"><span>{item.states.now?.name}</span><small>{layers.find(entry => entry.id === item.layer)?.title} · {item.mapPrecision === 'anchor' ? 'ориентир' : placeTypeNames[item.kind]}</small></span><ChevronRight size={15}/></button>) : layer === 'places' ? settlements.map((item,index) => <button key={item.id} className="city-row" onClick={() => selectCity(item.id)}><span className="city-number">{String(index+1).padStart(2,'0')}</span><span className="row-emblem">{assets[item.id]?.coat ? <img src={assetUrl(assets[item.id].coat)} alt=""/> : <Building2 size={20}/>}</span><span className="row-titles"><span>{item.name}</span><small>{getCityPoints(item.id).length} мест · {item.historicalName}</small></span><ChevronRight size={15}/></button>) : getLayerPoints(layer).map((item,index) => <button key={item.id} className="city-row object-row" onClick={() => selectPlace(item.id)}><span className="city-number">{String(index+1).padStart(2,'0')}</span><span className="row-emblem object-row-icon"><PlaceIcon place={item} size={20}/></span><span className="row-titles"><span>{item.states.now?.name}</span><small>{settlements.find(entry => entry.id === item.cityId)?.name} · {item.mapPrecision === 'anchor' ? 'ориентир' : item.storyKind}</small></span><ChevronRight size={15}/></button>)}
          {city && <div className="sidebar-city-credits"><Credits sources={city.sources} media={registry.filter(item=>item.cityId===city.id)}/></div>}
        </div>
        <div className="sidebar-footer"><Layers size={17}/><span>{city ? 'Выберите точку, чтобы открыть её историю' : layer === 'places' ? 'Выберите город: откроется карта со всеми местами' : 'Выберите точку: откроется карта города и карточка'}</span></div>
      </aside>
      <section className="map-surface" aria-label="Интерактивная карта">
        <AtlasMap layer={layer} city={city} placeId={placeId} assets={assets} selectCity={selectCity} selectPlace={selectPlace} mapRef={mapRef}/>
        {!city && <nav className="layer-switcher" aria-label="Тематические слои">{layers.map(item => <button key={item.id} onClick={() => changeLayer(item.id)} className={layer === item.id ? 'chosen' : ''} aria-pressed={layer === item.id}><span>{item.title}</span><small>{item.short}</small></button>)}</nav>}
        {city && <nav className="city-map-navigation" aria-label="Навигация по атласу"><button onClick={backToRegion}><ArrowLeft size={17}/>К области</button><span className="nav-divider"/><span className="current-city-name">{city.name} · все слои</span>{assets[city.id]?.coat && <img src={assetUrl(assets[city.id].coat)} alt=""/>}</nav>}
        <div className="map-footer"><div className="map-legend">{city ? <><MapPin size={14}/>{cityPoints.length} записей · все темы</> : layer === 'places' ? <><span className="border-sample"/>Современный контур области · 26 населённых пунктов</> : <><span className="legend-dot"/>{currentLayer.title} · {regionalCount} записей · ◌ ориентир</>}</div></div>
        <button className="mobile-list-button" onClick={() => setListOpen(true)}><List size={18}/>{city ? 'Места' : layer === 'places' ? 'Города' : 'Точки'}<span>{city ? cityPoints.length : regionalCount}</span></button>
        {place && city && <ObjectCard place={place} city={city} assets={assets} close={() => navigate(selected,null)} focus={focusPlace}/>}
      </section>
    </main>
    {about && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setAbout(false); }}><div ref={dialog} className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title"><button ref={closeAbout} className="dialog-close icon-button" aria-label="Закрыть информацию об атласе" onClick={() => setAbout(false)}><X size={22}/></button><span className="eyebrow">Карта, места и истории</span><h2 id="about-title">Пять слоёв одной области.</h2><p>На карте области показаны все 26 населённых пунктов и все 58 тематических записей исследовательских списков. Выбор населённого пункта открывает карту связанных с ним точек всех тем.</p><h3>Как читать карту</h3><p>Компактная точка раскрывает круглое изображение при наведении. Пунктирная обводка означает ориентир: точное место события, маршрута или исторического адреса ещё не определено. В карточке указан исходный статус геопривязки и описание из исследования. Музей или памятник не заменяет место самого сражения.</p><p>Легенды и современный фольклор отмечены отдельно от исторических фактов. Для маркеров использованы координаты первого прототипа, локальная выгрузка OpenStreetMap и ориентиры исследовательского пакета.</p><h3>Источники</h3><p>В каждой карточке открывается исходный исследовательский список со ссылками на его источники. Права на фотографии и гербы доступны в карточках городов.</p><div className="source-links"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap · © участники, ODbL<ArrowUpRight size={15}/></a><a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap · картографическая подложка<ArrowUpRight size={15}/></a><a href="https://www.geoboundaries.org/" target="_blank" rel="noopener noreferrer">geoBoundaries · контур области<ArrowUpRight size={15}/></a></div><span className="prototype-note">Исследовательский прототип · тематические слои v0.2</span></div></div>}
  </div>;
}
