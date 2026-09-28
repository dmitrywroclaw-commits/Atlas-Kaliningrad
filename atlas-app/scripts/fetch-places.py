import json, pathlib, re, urllib.parse, urllib.request

query = '''[out:json][timeout:60];(nwr(54.30,19.55,55.30,22.95)["historic"];nwr(54.30,19.55,55.30,22.95)["tourism"="attraction"];nwr(54.30,19.55,55.30,22.95)["man_made"="water_tower"];nwr(54.30,19.55,55.30,22.95)["man_made"="lighthouse"];nwr(54.30,19.55,55.30,22.95)["amenity"="place_of_worship"];nwr(54.30,19.55,55.30,22.95)["tourism"="museum"];);out center tags;'''
url = 'https://overpass-api.de/api/interpreter'
request = urllib.request.Request(url, data=urllib.parse.urlencode({'data':query}).encode(), headers={'User-Agent':'KaliningradAtlasPrototype/0.1 (local research)'})
with urllib.request.urlopen(request, timeout=90) as response:
    data = json.load(response)
if data.get('remark'):
    raise RuntimeError(data['remark'])
out = pathlib.Path(__file__).resolve().parents[1] / 'public/data/places-osm.json'
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
for e in data['elements']:
    tags=e.get('tags',{})
    if not re.search('Кафедральный|Рыбная|Инстербург|Тапиау|Рагнит|Эйлау|Георгия Победоносца|[Кк]оролевы Луизы|[Вв]одонапорная башня|Пиллау|[Мм]аяк|Гусевский|Баркла.*Толли|Мурариум|Тильзит|Зальцбург|Кёнигсберг|Светлогор|Зеленоград|Иоанна Предтечи', tags.get('name','')):
        continue
    c=e.get('center', e)
    print(json.dumps({'id':str(e['type'])+'/'+str(e['id']),'name':tags.get('name'),'lon':c.get('lon'),'lat':c.get('lat'),'historic':tags.get('historic'),'tourism':tags.get('tourism')},ensure_ascii=False))
