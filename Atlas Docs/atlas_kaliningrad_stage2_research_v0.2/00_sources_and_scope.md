# Источники и рамки этапа 2

## 1. Базовые источники проекта

- Исходный концепт: `sources/Kaliningrad_History_Atlas_Concept_TZ_v0.1.md`.
- Тестовая версия: <https://dmitrywroclaw-commits.github.io/Atlas-Kaliningrad/?era=now&markers=compact>
- GitHub: <https://github.com/dmitrywroclaw-commits/Atlas-Kaliningrad>

Исходный концепт требует разделять исторический факт, легенду, городской фольклор, гипотезу и локальную память, а также вести источник и степень уверенности для материалов. Эта логика сохраняется и становится основой тематических слоёв.

## 2. Иерархия источников

Для рабочего корпуса используется следующий порядок приоритета:

1. **архив / оцифрованный первичный документ / научная публикация**;
2. **государственный или профильный музей, национальный парк, библиотека**;
3. **официальный туристический центр / муниципальный культурный ресурс**;
4. **историческое общество / краеведческий ресурс с указанием источников**;
5. **вторичный популярный материал** — только как указатель для дальнейшей проверки.

Для легенд источник подтверждает **существование и бытование рассказа**, но не истинность описанного события.

## 3. Основные веб-источники этой сборки

### Регион и туризм
- Туристический центр Калининградской области: <https://visit-kaliningrad.ru/>
- История Калининграда/Кёнигсберга: <https://visit-kaliningrad.ru/blog/history/>
- Путеводитель по Черняховску: <https://visit-kaliningrad.ru/blog/chernyakhovsk/>
- Путеводитель по Гусеву: <https://visit-kaliningrad.ru/blog/gusev/>
- Путеводитель по Балтийску: <https://visit-kaliningrad.ru/blog/putevoditel-po-baltiysku/>
- Путеводитель по Багратионовску: <https://visit-kaliningrad.ru/blog/puteshestvie-k-yuzhnym-granitsam-bagrationovsk/>

### Военная история
- Российское военно-историческое общество — Гросс-Егерсдорф: <https://rvio.ru/activities/news/v-kaliningradskoi-oblasti-otkryt-pamyatnyi-znak-pobede-russkoi-armii-v-srazenii-pri-gross-egersdorfe>
- Портал «Первая мировая война» — Гумбиннен: <https://gwar.mil.ru/events/19/>
- Портал «Первая мировая война» — Шталлупёнен: <https://gwar.mil.ru/events/156/>
- Багратионовский музей истории края: <https://visit-kaliningrad.ru/entertainment/culture/museums/bagrationovskiy-muzey-istorii-kraya/>
- Фридланд/Правдинск — памятные места: <https://visit-kaliningrad.ru/excursions/istoriya-srednevekovykh-gorodov-fridland-gerdauen/>
- КОИХМ — Форт №5: <https://koihm.ru/filialy/muzej-fort-5/>
- КОИХМ — штурм Кёнигсберга: <https://koihm.ru/shturm-kyonigsberga/>
- КОИХМ — музей «Бункер»: <https://koihm.ru/english/>

### Мифология и фольклор
- Национальный парк «Куршская коса», «Мифы и легенды»: <https://park-kosa.ru/mifyi-i-legendyi>
- «Танцующий лес»: <https://park-kosa.ru/tantsy-v-lesu-i-vokrug-lesa>
- «Озеро Лебедь»: <https://www.park-kosa.ru/lebedinoe-ozero>
- Калининградский музей янтаря — легенды: <https://www.ambermuseum.ru/home/about_amber/legends.html>
- «Юрате и Каститис»: <https://www.ambermuseum.ru/about_amber/legends/jurate_and_kastytis/>

### Литература
- Росситтен и «Майорат» Гофмана: <https://www.park-kosa.ru/ot-ryiczarej-k-sovremennosti.-razvitie-czivilizaczii-posle-xiii-veka>
- Калининградская ЦБС — Сергей Снегов: <https://kaliningradlib.ru/node/18968>
- Deutsche Digitale Bibliothek — Johannes Bobrowski: <https://www.deutsche-digitale-bibliothek.de/person/gnd/118512161>
- Culture.ru — Юрий Буйда: <https://www.culture.ru/events/138868/vstrecha-s-yuriem-buidoi>
- Зеленоградская библиотека им. Ю. Н. Куранова: <https://visit-kaliningrad.ru/pro/2022/kalendar-sobytiy-2022.php>
- Светлогорская библиотека им. А. З. Дмитровского: <https://www.culture.ru/institutes/94841/svetlogorskaya-centralnaya-biblioteka-im-a-z-dmitrovskogo>
- Центр Солженицына — фронтовые впечатления и «Прусские ночи»: <https://solzhenitsyn.ru/interview/?ELEMENT_ID=1871>

## 4. Поля каждой исследовательской записи

```yaml
id: stable_slug
name: современное название
historical_names: []
category: settlement | battlefield | memorial | museum | folklore_place | literary_place | route | area
period: текст или даты
geometry_hint: point | area | line | cluster
lat: null
lon: null
geo_status: ready_point | rough_anchor | needs_georef | area_required | research
content_kind: fact | legend | folklore | hypothesis | memory
confidence: high | medium | low | not_applicable
source_ids: []
notes: []
```

## 5. Что ещё проверить до публикации

- точные полигоны полей сражений по историческим картам;
- старые/новые стили дат для XVIII–XIX вв.;
- точные современные адреса исчезнувших литературных и исторических объектов;
- авторское происхождение поздних «древних легенд»;
- лицензии визуальных материалов отдельно от фактических источников.
