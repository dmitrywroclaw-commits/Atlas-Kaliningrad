"""Build the small editorial POI selection from the saved OSM extract."""
import json
from pathlib import Path

elements = json.loads(Path('public/data/places-osm.json').read_text(encoding='utf-8'))['elements']
osm = {f"{e['type']}/{e['id']}": e for e in elements}
places = []
tourism = 'https://visit-kaliningrad.ru/'

def state(name, description, date=None):
    result = dict(name=name, description=description)
    if date: result['date'] = date
    return result

def add(id, city, kind, position, now, history=None, source=None, photo=None):
    sources = []
    if isinstance(position, str):
        e = osm[position]
        c = e.get('center', e)
        coordinates = [c['lon'], c['lat']]
        sources.append(dict(title='Координаты · OpenStreetMap', url=f'https://www.openstreetmap.org/{position}'))
    else:
        coordinates = position
    if source:
        sources.insert(0, dict(title='История и описание объекта', url=source))
    item = dict(id=id, cityId=city, kind=kind, coordinates=coordinates, states={'now': now, **(history or {})}, sources=sources)
    if photo: item['photoCityId'] = photo
    places.append(item)

add('konigsberg-castle','kaliningrad','castle','way/701517163',
    state('Место Королевского замка','Замок утрачен. На карте отмечено место его западного флигеля; это исторический узел города, а не сохранившееся здание.'),
    {'kant':state('Королевский замок','Бывший орденский замок в центре Кёнигсберга. В XVIII веке комплекс сохраняет своё место в городской жизни.'),
     'order':state('Замок Кёнигсберг','Орденский замок у Прегеля, с которого началось развитие Кёнигсберга. Позднее — резиденция великого магистра.','Основание · 1255')},
    'https://ru.wikipedia.org/wiki/Кёнигсбергский_замок')
add('konigsberg-cathedral','kaliningrad','church',[20.511667,54.706111],
    state('Кафедральный собор','Восстановленный собор на острове Канта: музейные экспозиции и органные концерты.'),
    {'kant':state('Собор Кнайпхофа','Лютеранский собор рядом с университетом Альбертина. Место связано с жизнью университетского города.'),
     'order':state('Собор Кнайпхофа','Кирпичный готический собор на острове Кнайпхоф. Его строительство относится к XIV веку.','Строительство · 1333–1380')},
    'https://ru.wikipedia.org/wiki/Кафедральный_собор_Кёнигсберга')
add('old-albertina','kaliningrad','monument','node/926631143',
    state('Место старой Альбертины','Памятный знак на месте старого здания Кёнигсбергского университета.'),
    {'kant':state('Старая Альбертина','Университет на Кнайпхофе, где Кант учился и преподавал. Отмечено место старого университетского здания.','Основание университета · 1544')},
    'https://ru.wikipedia.org/wiki/Кёнигсбергский_университет')
add('fish-village','kaliningrad','quarter','way/148564494',
    state('Рыбная деревня','Современный квартал у Преголи с набережной и видовой башней. Точка отмечает башню внутри квартала.'),
    source='https://ru.wikipedia.org/wiki/Рыбная_деревня',photo='kaliningrad')

add('tilsit-castle','sovetsk','castle',[21.907222,55.081389],
    state('Руины замка Тильзит','Частично сохранившиеся остатки замкового комплекса у Немана.'),
    {'kant':state('Замок Тильзит','Старый замок внутри растущего торгового города. В этот период ещё сохраняет военное использование.'),
     'order':state('Замок Тильзит','Пограничная крепость Тевтонского ордена на Немане. Поселение рядом позднее станет городом.','Строительство · 1404–1410')},
    'https://ru.wikipedia.org/wiki/Замок_Тильзит')
add('queen-louise-bridge','sovetsk','bridge','way/36823080',
    state('Мост королевы Луизы','Мост через Неман и его исторический портал — один из узнаваемых символов Советска.','Открытие · 1907'),
    source=tourism+'blog/sovetsk/')
add('tilsit-water-tower','sovetsk','tower','way/379086807',
    state('Водонапорная башня Тильзита','Башня у железнодорожного узла — памятник технической архитектуры города.'),source=tourism+'blog/sovetsk/')

add('insterburg-castle','chernyakhovsk','castle','way/81028924',
    state('Замок Инстербург','Сохранившиеся части орденского комплекса и руины замка в историческом центре Черняховска.'),
    {'kant':state('Замок Инстербург','Средневековый комплекс в составе города Инстербурга.'),
     'order':state('Замок Инстербург','Орденский форпост в Надровии, предшествующий городскому поселению.','Основание · 1336')},
    tourism+'entertainment/sights/castles/zamok-insterburg/')
add('insterburg-water-tower','chernyakhovsk','tower','node/6393279785',
    state('Водонапорная башня Инстербурга','Городская водонапорная башня — объект технического наследия Черняховска.'))

add('salzburg-church','gusev','church',[22.195,54.586944],
    state('Зальцбургская кирха','Лютеранская кирха, нынешнее здание которой построено в XIX веке.','Нынешнее здание · 1839–1840'),
    {'kant':state('Первая Зальцбургская кирха','На этом месте зальцбургские переселенцы построили временную кирху. Нынешнее каменное здание появится позднее.','Первый храм · 1752–1754')},
    'https://ru.wikipedia.org/wiki/Зальцбургская_кирха')
add('gusev-museum','gusev','museum','way/107780156',
    state('Историко-краеведческий музей','Музей истории города и края имени А. М. Иванова.','Основание музея · 1991'),
    source=tourism+'entertainment/culture/museums/gusevskij-istoriko-kraevedcheskij-muzej-im-a-m-ivanova/')
add('gumbinnen-government','gusev','building','node/4945622321',
    state('Дом с часами','Бывшее здание правительства округа Гумбиннен — заметный городской ориентир.'),source=tourism+'blog/gusev/')

add('pillau-citadel','baltiysk','castle','way/48371990',
    state('Цитадель Пиллау','Звездообразная крепость у морского пролива. Это укрепление XVII века, а не орденский замок.'),
    {'kant':state('Крепость Пиллау','Крепость защищает важный порт у входа в залив.','Начало строительства · 1626')},
    tourism+'entertainment/sights/forty-i-bastiony/citadel-pillau/')
add('baltiysk-lighthouse','baltiysk','tower','way/223723630',
    state('Балтийский маяк','Маяк у входа в пролив. Нынешняя башня относится к XIX веку.','Нынешняя башня · 1813–1816'),
    source='https://ru.wikipedia.org/wiki/Балтийский_маяк')

add('murarium','zelenogradsk','tower','way/133724496',
    state('Водонапорная башня · Мурариум','Старинная башня с музеем кошек и смотровой площадкой.'),
    source=tourism+'entertainment/sights/sightseeings/muzej-murarium/')
add('zelenogradsk-museum','zelenogradsk','museum','way/226050760',
    state('Краеведческий музей','Музей истории Кранца и Зеленоградска в историческом здании.'))

add('rauschen-water-tower','svetlogorsk','tower','way/185249646',
    state('Водонапорная башня Раушена','Башня комплекса водогрязелечебницы — один из символов Светлогорска.','Строительство · 1907–1908'),
    source=tourism+'entertainment/sights/gorodskie-zdaniya/zdanie-s-vodonapornoj-bashnej/',photo='svetlogorsk')
add('zodiac-sundial','svetlogorsk','monument','way/995725092',
    state('Солнечные часы «Зодиак»','Мозаичные солнечные часы на морском променаде Светлогорска.'))

add('eylau-castle','bagrationovsk','castle','way/131324520',
    state('Форбург Прейсиш-Эйлау','Сохранившаяся хозяйственная часть замка. Основной замок дошёл до нас в виде руин.'),
    {'kant':state('Замок Прейсиш-Эйлау','Старый замковый комплекс у поселения Прейсиш-Эйлау.'),
     'order':state('Замок Прейсиш-Эйлау','Орденская крепость на юге современной области.','Основание · 1325–1326')},
    tourism+'blog/puteshestvie-k-yuzhnym-granitsam-bagrationovsk/',photo='bagrationovsk')
add('bagrationovsk-museum','bagrationovsk','museum','way/1085593395',
    state('Музей истории края','Городской музей Багратионовска: история Прейсиш-Эйлау и окрестностей.'))

add('friedland-church','pravdinsk','church','way/117515241',
    state('Свято-Георгиевский храм','Бывшая кирха Фридланда, сохранившаяся в центре Правдинска.'),
    {'kant':state('Кирха Фридланда','Городской храм средневекового происхождения в центре Фридланда.'),
     'order':state('Кирха Фридланда','Кирпичная готическая церковь в средневековом городе.','Начало строительства · XIV век')},
    'https://ru.wikipedia.org/wiki/Фридландская_кирха',photo='pravdinsk')
add('friedland-wall','pravdinsk','fortification','node/8618436817',
    state('Руины городской стены','Сохранившийся фрагмент укреплений средневекового Фридланда.'),
    {'kant':state('Старая городская стена','Место средневековой линии укреплений Фридланда; показано по сохранившемуся фрагменту.'),
     'order':state('Городская стена Фридланда','Городские укрепления Фридланда. Точка отмечает место сохранившегося фрагмента стены.')},
    'https://ru.wikipedia.org/wiki/Правдинск')

add('tapiau-castle','gvardeysk','castle','way/84818610',
    state('Замок Тапиау','Сохранившийся орденский замок на берегу реки Деймы.'),
    {'kant':state('Замок Тапиау','Средневековый комплекс в городе Тапиау.'),
     'order':state('Замок Тапиау','Орденская крепость на речных путях у слияния Прегеля и Деймы.','Орденский замок · XIII–XIV века')},
    tourism+'entertainment/sights/castles/zamok-tapiau/')
add('tapiau-church','gvardeysk','church','way/85828721',
    state('Храм Иоанна Предтечи','Бывшая городская кирха на центральной площади Гвардейска.'),
    {'kant':state('Городская кирха Тапиау','Храм на центральной площади города, построенный в конце XVII века.')},
    tourism+'entertainment/sights/sightseeings/tsentralnaya-ploshchad-goroda-gvardeyska/',photo='gvardeysk')

add('ragnit-castle','neman','castle','relation/1638480',
    state('Замок Рагнит','Руины большого кирпичного замка в центре Немана.'),
    {'kant':state('Замок Рагнит','Старый орденский замок в городе Рагните.'),
     'order':state('Замок Рагнит','Монументальный каменный замок Тевтонского ордена у Немана.','Каменный замок · 1397–1409')},
    tourism+'entertainment/sights/castles/zamok-ragnit/',photo='neman')
add('mennonite-church','neman','church','way/119086611',
    state('Кирха меннонитов','Историческое здание кирхи в Немане.','Строительство · 1853'))

Path('src/places-data.json').write_text(json.dumps(places,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Created {len(places)} places for 11 cities')
