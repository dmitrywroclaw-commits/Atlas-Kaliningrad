# Фильтры карты и модель данных для этапа 2

## 1. Что меняется относительно прототипа v0.1

Текущие режимы `now / kant / order` лучше перестать показывать как главную навигацию. Данные Канта и Ордена сохраняются, но пользовательская логика становится **тематической**.

Предлагаемая верхняя панель:

```text
[ Места ] [ Войны ] [ Легенды ] [ Литература ] [ Память ]
```

Дополнительный фильтр периода появляется только внутри выбранной темы.

## 2. Предлагаемые фильтры

### Места

```text
places.all
places.cities
places.historic_towns
places.castles_forts
places.architecture
places.nature_landscape
places.industrial
places.coast_ports
```

### Военная история

```text
military.seven_years
military.napoleonic
military.ww1
military.ww2

military.kind.battlefield
military.kind.command_site
military.kind.memorial
military.kind.museum
```

### Мифология и фольклор

```text
folklore.prussian
folklore.curonian
folklore.baltic_amber
folklore.urban
folklore.modern
folklore.hypotheses
```

### Литература

```text
literature.birthplace
literature.residence
literature.work_setting
literature.author_route
literature.memory_institution
```

### Память

```text
memory.military_graves
memory.memorials
memory.lost_places
memory.postwar
```

## 3. Нужен не один `place`, а связка сущностей

```yaml
place:
  id: string
  name: string
  historical_names: []
  geometry:
    type: Point | Polygon | LineString | MultiPolygon
    coordinates: ...
  settlement_id: string|null
  tags: []
  geo_status: ready_point | rough_anchor | needs_georef | area_required | research
  story_ids: []
  event_ids: []
  source_ids: []

event:
  id: string
  title: string
  event_type: battle | assault | occupation | biography | literary | folklore
  date_from: string|null
  date_to: string|null
  participant_tags: []
  place_ids: []
  source_ids: []

story:
  id: string
  kind: fact | legend | folklore | hypothesis | memory
  title: string
  lead: string
  body: string
  place_ids: []
  event_ids: []
  confidence: high | medium | low | not_applicable
  source_ids: []

source:
  id: string
  title: string
  url: string
  publisher: string
  source_type: primary | museum | academic | official_tourism | secondary
  retrieved_at: 2026-09-30
```

## 4. Почему событие нужно вынести отдельно

Одна битва может иметь:

- большое поле боя (`Polygon`);
- несколько конкретных эпизодов (`Point`/`LineString`);
- могилы и мемориалы (`Point`);
- музей (`Point`);
- несколько историй и биографий.

Если всё хранить как независимые `places`, карта потеряет смысловую связь. `event_id` решает эту проблему.

## 5. Визуальная логика

- **точка** — конкретный объект: памятник, дом, бункер, кирха, музей;
- **контур/заливка** — поле боя, исчезнувший квартал, большая зона;
- **линия** — маршрут армии, писателя, историческая дорога;
- **кластер** — группа связанных городских объектов (например, хомлины);
- **story badge** — факт / легенда / фольклор / гипотеза.

## 6. Скрытие старых фильтров без удаления данных

Технически можно оставить текущие `eraId` и исторические состояния, но убрать переключатель `Кант / Орден` с главного экрана. Позже их использовать как:

```text
period: 1255–1525
person: immanuel_kant
context: teutonic_order
```

То есть из глобальных режимов они превращаются в обычные метаданные и дополнительные фильтры.

## 7. Минимальный следующий инкремент прототипа

1. Добавить фильтры `Места / Войны / Легенды / Литература`.
2. Импортировать 20–30 новых точек с `geo_status=ready_point`.
3. Для 3–5 сражений добавить тестовые полигоны вместо pin-маркеров.
4. Сделать одну карточку легенды с явным сравнением `Что известно / Что рассказывают`.
5. Сделать одну литературную карточку с типом связи `место действия / жизнь автора`.
6. Скрыть из UI Канта и Орден, но сохранить старые URL/данные совместимыми.

## 8. Предлагаемые URL-параметры

```text
?layer=places
?layer=military&conflict=napoleonic
?layer=military&conflict=ww2&kind=battlefield
?layer=folklore&type=urban
?layer=literature&relation=work_setting
```

Старый `?era=kant` можно временно поддерживать как legacy deep link, даже если переключатель эпох скрыт.
