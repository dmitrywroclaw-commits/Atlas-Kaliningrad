export type EraId = 'now' | 'kant' | 'order';
export type MarkerStyle = 'photo' | 'coat' | 'compact';
export type PlaceType = 'city' | 'castle' | 'port' | 'settlement';
export interface HistoricalState { name: string; latin: string; visible: boolean; type: PlaceType; date: string; description: string; reason?: string; coordinates?: [number, number] }
export interface City { id: string; name: string; coordinates: [number, number]; caption: string; states: Record<EraId, HistoricalState>; sources: { title: string; url: string }[] }
export const eras: { id: EraId; title: string; period: string; eyebrow: string; description: string }[] = [
  { id: 'now', title: 'Наши дни', period: '2026', eyebrow: 'Область сегодня', description: 'Города у моря и на реках, старые замки и новые имена. Начните с места, которое вам интересно.' },
  { id: 'kant', title: 'Время Канта', period: '1724–1804', eyebrow: 'Города Просвещения', description: 'Кёнигсберг, торговые города и порт Пиллау. Небольшие прибрежные поселения остаются за пределами этого слоя.' },
  { id: 'order', title: 'Тевтонский орден', period: '1255–1525', eyebrow: 'Замки и средневековые города', description: 'Крепости на речных путях и средневековый Фридланд. Будущие города показаны через значимые замки.' },
];
export const typeNames: Record<PlaceType, string> = { city: 'Город', castle: 'Орденский замок', port: 'Город и порт', settlement: 'Поселение' };
const state = (name: string, latin: string, type: PlaceType, date: string, description: string, extra: Partial<HistoricalState> = {}): HistoricalState => ({ name, latin, type, date, description, visible: true, ...extra });
const coastReason = 'Небольшое прибрежное поселение. Скрыто по критерию значимости этого слоя; это не означает, что место не существовало.';
const wiki = (title: string) => ({ title: 'История и названия · Википедия', url: `https://ru.wikipedia.org/wiki/${encodeURIComponent(title)}` });
export const cities: City[] = [
  { id: 'kaliningrad', name: 'Калининград', coordinates: [20.507, 54.710], caption: 'Остров Канта и город на Преголе',
    states: {
      now: state('Калининград', 'Königsberg', 'city', 'Современность', 'Кафедральный собор на острове Канта, набережные Преголи и память о Кёнигсберге встречаются в одном городе.'),
      kant: state('Кёнигсберг', 'Königsberg', 'city', 'Объединение городов · 1724', 'Альтштадт, Лёбенихт и Кнайпхоф объединены в 1724 году. Университетский город — главное место жизни и работы Канта.'),
      order: state('Кёнигсберг', 'Königsberg', 'castle', 'Основание замка · 1255', 'Орденский замок и три средневековых города у Прегеля. С 1457 года Кёнигсберг — резиденция великого магистра.', { coordinates: [20.510, 54.710] }),
    }, sources: [{ title: 'История Калининграда · Туристический центр', url: 'https://visit-kaliningrad.ru/blog/history/' }, { title: 'Иммануил Кант · Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu/entries/kant/' }, wiki('Кёнигсберг')] },
  { id: 'sovetsk', name: 'Советск', coordinates: [21.878, 55.081], caption: 'Город на Немане',
    states: {
      now: state('Советск', 'Tilsit', 'city', 'Современность', 'Старые кварталы и мост Королевы Луизы хранят память о Тильзите. Город стоит на южном берегу Немана.'),
      kant: state('Тильзит', 'Tilsit', 'city', 'Городское право · 1552', 'Торговый город на Немане. Тильзитский мир 1807 года относится уже к следующему периоду, после смерти Канта.'),
      order: state('Замок Тильзит', 'Tilsit', 'castle', 'Строительство · 1404–1410', 'Пограничная крепость у Немана. Поселение рядом ещё не имеет городского статуса, полученного позднее.'),
    }, sources: [{ title: 'Хронология Тильзита · Администрация Калининграда', url: 'https://www.klgd.ru/city/history/gubin/k58.php?print=Y' }, wiki('Замок_Тильзит')] },
  { id: 'chernyakhovsk', name: 'Черняховск', coordinates: [21.810, 54.634], caption: 'Инстербург: от замка к городу',
    states: {
      now: state('Черняховск', 'Insterburg', 'city', 'Современность', 'Город на слиянии речных путей. Руины Инстербурга и сохранившиеся улицы позволяют читать историю прямо в городском пространстве.'),
      kant: state('Инстербург', 'Insterburg', 'city', 'Городское право · 1583', 'К XVIII веку поселение у замка стало городом. Старый орденский комплекс остаётся частью его исторического ядра.'),
      order: state('Замок Инстербург', 'Insterburg', 'castle', 'Основание · 1336', 'Форпост Тевтонского ордена на территории Надровии. Замок предшествует городу Инстербургу.', { coordinates: [21.811, 54.637] }),
    }, sources: [{ title: 'Замок Инстербург · Туристический центр', url: 'https://visit-kaliningrad.ru/entertainment/sights/castles/zamok-insterburg/' }, wiki('Черняховск')] },
  { id: 'gusev', name: 'Гусев', coordinates: [22.201, 54.592], caption: 'Гумбиннен и восток области',
    states: {
      now: state('Гусев', 'Gumbinnen', 'city', 'Современность', 'Восточный городской центр области. В архитектуре и музейных коллекциях сохраняется история Гумбиннена.'),
      kant: state('Гумбиннен', 'Gumbinnen', 'city', 'Открытие магистрата · 1724', 'Городской магистрат открылся в 1724 году. Развитие города связано с заселением восточной части Пруссии.'),
      order: state('Место будущего Гумбиннена', 'Gumbinnen', 'settlement', 'Вне слоя', 'Гумбиннен как городской центр относится к более позднему времени.', { visible: false, reason: 'Городской центр сформировался позднее. Подтверждённого значимого орденского замка в этом месте в подборке нет.' }),
    }, sources: [{ title: 'Гусев · Большая российская энциклопедия', url: 'https://old.bigenc.ru/domestic_history/text/1936494' }, wiki('Гусев_(город)')] },
  { id: 'baltiysk', name: 'Балтийск', coordinates: [19.916, 54.644], caption: 'Пиллау и ворота в Балтику',
    states: {
      now: state('Балтийск', 'Pillau', 'port', 'Современность', 'Морской город у пролива между Балтийским морем и Калининградским заливом. Его история связана с гаванью и крепостью.'),
      kant: state('Пиллау', 'Pillau', 'port', 'Городское право · 1725', 'Порт и крепость у морского пролива. Пиллау получил городское право в начале выбранного периода.'),
      order: state('Пиллау', 'Pillau', 'settlement', 'Вне слоя', 'Прибрежное поселение. Известная крепость Пиллау была заложена в XVII веке, после эпохи Ордена.', { visible: false, reason: 'Портовый город и крепость получили значение позднее. Крепость XVII века не переносится в средневековый слой.' }),
    }, sources: [wiki('Балтийск')] },
  { id: 'zelenogradsk', name: 'Зеленоградск', coordinates: [20.476, 54.959], caption: 'Кранц у начала Куршской косы',
    states: {
      now: state('Зеленоградск', 'Cranz', 'city', 'Современность', 'Приморский город у начала Куршской косы. Променад, старые курортные улицы и водонапорная башня формируют его узнаваемый облик.'),
      kant: state('Кранц', 'Cranz', 'settlement', 'Вне слоя', 'Небольшое прибрежное поселение; курортное развитие относится к XIX веку.', { visible: false, reason: coastReason }),
      order: state('Кранц', 'Cranz', 'settlement', 'Вне слоя', 'Прибрежное поселение не включено в подборку значимых городов и орденских замков.', { visible: false, reason: coastReason }),
    }, sources: [wiki('Зеленоградск')] },
  { id: 'svetlogorsk', name: 'Светлогорск', coordinates: [20.153, 54.943], caption: 'Раушен на высоком берегу',
    states: {
      now: state('Светлогорск', 'Rauschen', 'city', 'Современность', 'Курортный город на высоком берегу Балтики. Лес, море и старая водонапорная башня задают его характер.'),
      kant: state('Раушен', 'Rauschen', 'settlement', 'Вне слоя', 'Небольшое поселение; известный курортный образ сложился позже.', { visible: false, reason: coastReason }),
      order: state('Раушен', 'Rauschen', 'settlement', 'Вне слоя', 'Поселение существует в историческом контексте, но не входит в выбранные значимые узлы.', { visible: false, reason: coastReason }),
    }, sources: [wiki('Светлогорск_(Калининградская_область)')] },
  { id: 'bagrationovsk', name: 'Багратионовск', coordinates: [20.639, 54.387], caption: 'Прейсиш-Эйлау у южной границы',
    states: {
      now: state('Багратионовск', 'Preußisch Eylau', 'city', 'Современность', 'Небольшой город на юге области. Сохранившийся форбург напоминает о замке Прейсиш-Эйлау.'),
      kant: state('Прейсиш-Эйлау', 'Preußisch Eylau', 'city', 'Городское право · 1585', 'Город вырос у орденского замка. Сражение 1807 года находится за пределами периода жизни Канта.'),
      order: state('Замок Прейсиш-Эйлау', 'Preußisch Eylau', 'castle', 'Строительство · 1325–1326', 'Орденский замок в Натангии. Укрепление связывало соседние замки и стало ядром будущего города.'),
    }, sources: [{ title: 'Замок Прейсиш-Эйлау · Туристический центр', url: 'https://visit-kaliningrad.ru/blog/puteshestvie-k-yuzhnym-granitsam-bagrationovsk/' }, wiki('Багратионовск')] },
  { id: 'pravdinsk', name: 'Правдинск', coordinates: [21.018, 54.443], caption: 'Средневековый Фридланд на Лаве',
    states: {
      now: state('Правдинск', 'Friedland', 'city', 'Современность', 'Компактный исторический город на Лаве. Кирха Святого Георгия и старые улицы сохраняют масштаб Фридланда.'),
      kant: state('Фридланд', 'Friedland', 'city', 'Город с XIV века', 'Город на реке Алле, современной Лаве. Знаменитая битва при Фридланде произошла в 1807 году, после выбранного периода.'),
      order: state('Фридланд', 'Friedland', 'city', 'Основание · 1312', 'Средневековый город, основанный в орденское время. В отличие от соседних будущих городов, показан как город, а не только замок.'),
    }, sources: [wiki('Правдинск')] },
  { id: 'gvardeysk', name: 'Гвардейск', coordinates: [21.071, 54.650], caption: 'Тапиау между Преголей и Деймой',
    states: {
      now: state('Гвардейск', 'Tapiau', 'city', 'Современность', 'Город у разветвления Преголи и Деймы. Замок Тапиау связывает современную жизнь с орденским прошлым.'),
      kant: state('Тапиау', 'Tapiau', 'city', 'Городское право · 1722', 'Поселение у замка получило городское право незадолго до рождения Канта. Речное положение сохраняет значение.'),
      order: state('Замок Тапиау', 'Tapiau', 'castle', 'Орденское укрепление · XIII век', 'Замок у речной развилки охранял подступы к Кёнигсбергу. Одно из наиболее сохранившихся орденских укреплений региона.'),
    }, sources: [{ title: 'Замок Тапиау · Туристический центр', url: 'https://visit-kaliningrad.ru/entertainment/sights/castles/zamok-tapiau/' }, wiki('Гвардейск')] },
  { id: 'neman', name: 'Неман', coordinates: [22.031, 55.039], caption: 'Рагнит над Неманом',
    states: {
      now: state('Неман', 'Ragnit', 'city', 'Современность', 'Город на высоком берегу Немана. Руины замка Рагнит остаются его главным историческим ориентиром.'),
      kant: state('Рагнит', 'Ragnit', 'city', 'Городское право · 1722', 'Город на Немане вырос вокруг старого замка и получил городское право в начале XVIII века.'),
      order: state('Замок Рагнит', 'Ragnit', 'castle', 'Первое укрепление · 1289', 'Орденская крепость на месте прусского укрепления. Сохранившийся кирпичный комплекс строился в конце XIV — начале XV века.'),
    }, sources: [{ title: 'Замок Рагнит · Туристический центр', url: 'https://visit-kaliningrad.ru/en/entertainment/ragnit-castle/' }, wiki('Неман_(город)')] },
];
export const getVisibleCities = (era: EraId) => cities.filter(city => city.states[era].visible);
export function parseState(search: string): { era: EraId; city: string | null; markers: MarkerStyle } {
  const params = new URLSearchParams(search);
  const era = eras.some(e => e.id === params.get('era')) ? params.get('era') as EraId : 'now';
  const city = cities.some(c => c.id === params.get('city')) ? params.get('city') : null;
  const markers = ['photo', 'coat', 'compact'].includes(params.get('markers') || '') ? params.get('markers') as MarkerStyle : 'photo';
  return { era, city, markers };
}
