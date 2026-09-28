import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Castle, ChevronRight, Compass, Image, Info, Layers, List, MapPin, Shield, X } from 'lucide-react';
import type { Map as LibreMap } from 'maplibre-gl';
import AtlasMap, { assetUrl, CityIcon, PlaceIcon, type Assets, type Media } from './AtlasMap';
import ObjectCard, { Credits } from './ObjectCard';
import { cities, eras, getVisibleCities, parseState, type EraId, type MarkerStyle } from './data';
import { getCityPlaces, places, placeTypeNames } from './places';
import { publicUrl } from './urls';

const initial = parseState(window.location.search);
function validPlace(search: string, cityId: string | null) {
  const id = new URLSearchParams(search).get('place');
  return places.some(place => place.id === id && place.cityId === cityId) ? id : null;
}

export default function App() {
  const [era, setEra] = useState<EraId>(initial.era);
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle>(initial.markers);
  const [selected, setSelected] = useState<string | null>(initial.city);
  const [placeId, setPlaceId] = useState<string | null>(validPlace(window.location.search, initial.city));
  const [assets, setAssets] = useState<Assets>({});
  const [registry, setRegistry] = useState<Media[]>([]);
  const [about, setAbout] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const mapRef = useRef<LibreMap | null>(null);
  const closeAbout = useRef<HTMLButtonElement>(null);
  const aboutTrigger = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const currentEra = eras.find(item => item.id === era)!;
  const visible = getVisibleCities(era);
  const hidden = cities.filter(city => !city.states[era].visible);
  const city = cities.find(item => item.id === selected);
  const cityPlaces = city ? getCityPlaces(city.id, era) : [];
  const hiddenPlaces = city ? places.filter(place => place.cityId === city.id && !place.states[era]) : [];
  const place = places.find(item => item.id === placeId && item.cityId === selected);

  const navigate = useCallback((cityId: string | null, objectId: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (cityId) params.set('city', cityId); else params.delete('city');
    if (objectId) params.set('place', objectId); else params.delete('place');
    const url = `${window.location.pathname}?${params}`;
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, '', url);
    setSelected(cityId); setPlaceId(objectId); setListOpen(false);
  }, []);
  const selectCity = useCallback((id: string) => navigate(id, null), [navigate]);
  const selectPlace = useCallback((id: string) => { const item = places.find(p => p.id === id); if (item) navigate(item.cityId, id); }, [navigate]);
  const backToRegion = useCallback(() => navigate(null, null), [navigate]);

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
    params.set('era', era); params.set('markers', markerStyle);
    if (selected) params.set('city', selected); else params.delete('city');
    if (placeId) params.set('place', placeId); else params.delete('place');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
    document.title = `${place?.states[era]?.name || city?.states[era].name || currentEra.title} — Атлас Калининградской области`;
  }, [era, markerStyle, selected, placeId, city, place, currentEra]);
  useEffect(() => {
    const handle = () => { const next = parseState(window.location.search); setEra(next.era); setMarkerStyle(next.markers); setSelected(next.city); setPlaceId(validPlace(window.location.search, next.city)); setListOpen(false); };
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
    if (about) { previousFocus.current = document.activeElement as HTMLElement; closeAbout.current?.focus(); }
    return () => { window.removeEventListener('keydown', handler); if (about) previousFocus.current?.focus(); };
  }, [about, selected, placeId, listOpen, navigate, backToRegion]);

  function focusPlace() {
    if (!place?.states[era]) return;
    mapRef.current?.flyTo({ center: place.coordinates, zoom: 16, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700, padding: { top: 145, bottom: window.innerWidth < 760 ? 290 : 110, left: 40, right: window.innerWidth < 760 ? 40 : 360 } });
  }
  const styles: { id: MarkerStyle; name: string; icon: typeof Image }[] = [{ id:'photo', name:'Фото + герб', icon:Image }, { id:'coat', name:'Гербы', icon:Shield }, { id:'compact', name:'Компактно', icon:MapPin }];

  return <div className={`atlas-app era-${era} ${city ? 'city-view' : 'region-view'}`}>
    <header className="header"><div className="brand"><span className="brand-mark"><Compass size={30} strokeWidth={1.2}/></span><div><span className="brand-kicker">Исторический атлас</span><h1>Калининградская область</h1></div></div><button ref={aboutTrigger} className="about-button" aria-label="Об атласе и источники" onClick={() => setAbout(true)}><BookOpen size={18}/><span>Об атласе и источники</span></button></header>
    <main className="workspace">
      <aside className={`sidebar ${listOpen ? 'mobile-open' : ''}`} aria-label={city ? 'Объекты города' : 'Места выбранной эпохи'}>
        <div className="sidebar-intro">
          {city && <button className="sidebar-back" onClick={backToRegion}><ArrowLeft size={16}/>Карта области</button>}
          <span className="eyebrow">{city ? currentEra.title : currentEra.eyebrow}</span>
          <div className="sidebar-title"><h2>{city ? city.states[era].name.replace(/^Замок /, '') : era === 'now' ? '11 городов' : `${visible.length} исторических мест`}</h2><button className="mobile-close icon-button" aria-label="Закрыть список" onClick={() => setListOpen(false)}><X size={20}/></button></div>
          <p>{city ? city.states[era].description : currentEra.description}</p>
          {city && !city.states[era].visible && <div className="city-empty-note"><Info size={16}/><span>{city.states[era].reason}</span></div>}
        </div>
        <div className="city-list">
          <div className="list-label"><span>{city ? 'Объекты на карте' : 'На карте'}</span><span>{String(city ? cityPlaces.length : visible.length).padStart(2,'0')}</span></div>
          {city ? <>
            {cityPlaces.map((item,index) => <button key={item.id} className={`city-row object-row ${placeId === item.id ? 'selected' : ''}`} onClick={() => selectPlace(item.id)} aria-pressed={placeId === item.id}><span className="city-number">{String(index+1).padStart(2,'0')}</span><span className="row-emblem object-row-icon">{era === 'now' && item.photoCityId && assets[item.photoCityId]?.photo ? <img src={assetUrl(assets[item.photoCityId].photo)} alt=""/> : <PlaceIcon place={item} size={20}/>}</span><span className="row-titles"><span>{item.states[era]?.name}</span><small>{placeTypeNames[item.kind]}</small></span><ChevronRight size={15}/></button>)}
            {cityPlaces.length === 0 && <p className="empty-objects">Для этой эпохи в подборке нет объектов. Можно переключить время или вернуться к области.</p>}
            {hiddenPlaces.length > 0 && <><div className="list-label hidden-label"><span>Вне этой эпохи</span><span>{String(hiddenPlaces.length).padStart(2,'0')}</span></div>{hiddenPlaces.map(item => <button key={item.id} className="city-row hidden-row" onClick={() => selectPlace(item.id)}><span className="city-number">—</span><span className="row-titles"><span>{item.states.now?.name}</span><small>Не показан в этом слое</small></span><Info size={15}/></button>)}</>}
            <div className="sidebar-city-credits"><Credits sources={city.sources} media={era === 'now' ? registry.filter(item=>item.cityId===city.id) : []}/></div>
          </> : <>
            {visible.map((item,index) => <button key={item.id} className="city-row" onClick={() => selectCity(item.id)}><span className="city-number">{String(index+1).padStart(2,'0')}</span><span className="row-emblem">{era === 'now' && assets[item.id]?.coat ? <img src={assetUrl(assets[item.id].coat)} alt=""/> : <CityIcon city={item} era={era}/>}</span><span className="row-titles"><span>{item.states[era].name.replace(/^Замок /,'')}</span><small>{era === 'now' ? item.states.now.latin : item.name}</small></span><ChevronRight size={15}/></button>)}
            {hidden.length > 0 && <><div className="list-label hidden-label"><span>Вне этого слоя</span><span>{String(hidden.length).padStart(2,'0')}</span></div>{hidden.map(item => <button key={item.id} className="city-row hidden-row" onClick={() => selectCity(item.id)}><span className="city-number">—</span><span className="row-titles"><span>{item.name}</span><small>{item.states[era].name.replace('Место будущего ','')}</small></span><Info size={15}/></button>)}</>}
          </>}
        </div>
        <div className="sidebar-footer"><Layers size={17}/><span>{city ? 'Выберите кружок объекта на карте' : era === 'now' ? 'Выберите город, чтобы открыть его карту' : 'Обзор периода, а не срез одного года'}</span></div>
      </aside>
      <section className="map-surface" aria-label="Карта и переключение эпох">
        <AtlasMap era={era} style={markerStyle} city={city} placeId={placeId} assets={assets} selectCity={selectCity} selectPlace={selectPlace} mapRef={mapRef}/>
        <nav className="era-switcher" aria-label="Выбор эпохи">{eras.map(item => <button key={item.id} onClick={() => setEra(item.id)} className={era === item.id ? 'chosen' : ''} aria-pressed={era === item.id}><span>{item.title}</span><small>{item.period}</small></button>)}</nav>
        {city && <nav className="city-map-navigation" aria-label="Навигация по атласу"><button onClick={backToRegion}><ArrowLeft size={17}/>К области</button><span className="nav-divider"/><span className="current-city-name">{city.states[era].name}</span>{era === 'now' && assets[city.id]?.coat && <img src={assetUrl(assets[city.id].coat)} alt=""/>}</nav>}
        <div className="map-footer"><div className="map-legend">{city ? <><MapPin size={14}/>{cityPlaces.length} объектов · {currentEra.title}</> : <><span className="border-sample"/>Современный контур области{era !== 'now' && <span className="era-legend"><Castle size={14}/>Замки и города периода</span>}</>}</div></div>
        {!city && <div className="marker-controls" role="group" aria-label="Вид маркеров"><span className="control-caption">{era === 'now' ? 'Маркеры' : 'Символы'}</span>{styles.map(item => <button key={item.id} className={markerStyle === item.id ? 'chosen' : ''} onClick={() => setMarkerStyle(item.id)} aria-pressed={markerStyle === item.id}><item.icon size={16}/><span>{era !== 'now' && item.id === 'photo' ? 'Крупно' : era !== 'now' && item.id === 'coat' ? 'На щите' : item.name}</span></button>)}</div>}
        <button className="mobile-list-button" onClick={() => setListOpen(true)}><List size={18}/>{city ? 'Объекты' : 'Места'}<span>{city ? cityPlaces.length : visible.length}</span></button>
        {place && city && <ObjectCard place={place} city={city} era={era} assets={assets} close={() => navigate(selected,null)} focus={focusPlace} showNow={() => setEra('now')}/>}
      </section>
    </main>
    {about && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setAbout(false); }}><div ref={dialog} className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title"><button ref={closeAbout} className="dialog-close icon-button" aria-label="Закрыть информацию об атласе" onClick={() => setAbout(false)}><X size={22}/></button><span className="eyebrow">Карта, места и время</span><h2 id="about-title">Одна область.<br/>Три взгляда на историю.</h2><p>Атлас соединяет 11 современных городов с их историческими названиями, средневековыми замками и городами времени Канта.</p><h3>Как читать исторические слои</h3><p>Эпохи — обзоры периодов 1724–1804 и 1255–1525. Места могли возникать и менять статус внутри этих интервалов; даты указаны в карточках.</p><p>Время Канта: города и значимый порт. Орден: важные замки и средневековые города. Скрытое место могло существовать как небольшое поселение. Эта подборка не является полным перечнем населённых пунктов.</p><p>Контур области и природная география используются для ориентации. Исторические политические границы и береговая линия не реконструированы. Маркеры привязаны к центрам мест; координаты не предназначены для точной навигации к входам в замки.</p><h3>Источники</h3><p>Источники истории и права на изображения доступны в каждой карточке. Фотографии показываются только в современном слое. Символы замков — условные обозначения.</p><div className="source-links"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap · © участники, ODbL<ArrowUpRight size={15}/></a><a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap · картографическая подложка<ArrowUpRight size={15}/></a><a href="https://www.geoboundaries.org/" target="_blank" rel="noopener noreferrer">geoBoundaries · контур области, данные OSM 2017<ArrowUpRight size={15}/></a><a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer">Wikimedia Commons · фотографии и гербы<ArrowUpRight size={15}/></a></div><span className="prototype-note">Исследовательский прототип · версия 0.1</span></div></div>}
  </div>;
}
