import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transpileModule, ModuleKind } from 'typescript';

const source = await readFile(new URL('../src/data.ts', import.meta.url), 'utf8');
const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext } }).outputText;
const { cities, eras, getVisibleCities, parseState } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const registry = JSON.parse(await readFile(new URL('../public/media/registry.json', import.meta.url), 'utf8'));

test('Approved eleven cities exist once and get progressively fewer historical markers', () => {
  assert.deepEqual(cities.map(c => c.id), ['kaliningrad','sovetsk','chernyakhovsk','gusev','baltiysk','zelenogradsk','svetlogorsk','bagrationovsk','pravdinsk','gvardeysk','neman']);
  assert.deepEqual(eras.map(e => getVisibleCities(e.id).length), [11, 9, 7]);
});
test('Medieval layer preserves six important castles and the real medieval city', () => {
  assert.deepEqual(getVisibleCities('order').filter(c => c.states.order.type === 'castle').map(c => c.id), ['kaliningrad','sovetsk','chernyakhovsk','bagrationovsk','gvardeysk','neman']);
  assert.equal(cities.find(c => c.id === 'pravdinsk').states.order.type, 'city');
  assert.equal(cities.find(c => c.id === 'baltiysk').states.order.visible, false);
});
test('Hidden places retain explanations and all places keep readable states and sources', () => {
  for (const city of cities) {
    assert.ok(city.sources.length);
    city.sources.forEach(s => assert.equal(new URL(s.url).protocol, 'https:'));
    assert.ok(city.coordinates[0] > 19 && city.coordinates[0] < 23);
    assert.ok(city.coordinates[1] > 54 && city.coordinates[1] < 56);
    for (const era of eras) {
      const state = city.states[era.id];
      assert.ok(state.name && state.description && state.date);
      if (!state.visible) assert.ok(state.reason?.length > 30, `${city.id}: missing reason`);
    }
  }
});
test('Deep links keep a selected place even when its marker is absent in the era', () => {
  assert.deepEqual(parseState('?era=order&city=gusev&markers=coat'), { era:'order', city:'gusev', markers:'coat' });
  assert.deepEqual(parseState('?era=unknown&city=unknown&markers=unknown'), { era:'now', city:null, markers:'photo' });
});
test('All eleven cities have real local photos and authentic shields with attribution', async () => {
  assert.equal(registry.length, 22);
  for (const city of cities) {
    for (const kind of ['photo','coat']) {
      const entries = registry.filter(m => m.cityId === city.id && m.kind === kind);
      assert.equal(entries.length, 1, `${city.id}: ${kind}`);
      const entry = entries[0];
      assert.ok(entry.author && entry.license && entry.licenseUrl && entry.attribution);
      assert.ok(new URL(entry.sourceUrl).hostname === 'commons.wikimedia.org');
      const bytes = await readFile(new URL(`../public/media/${entry.filename}`, import.meta.url));
      assert.ok(bytes.length > 500);
      if (kind === 'photo') assert.equal(bytes.subarray(0,2).toString('hex'), 'ffd8');
    }
  }
});
test('Geography is a sourced Kaliningrad polygon, not an illustrative silhouette', async () => {
  const geo = JSON.parse(await readFile(new URL('../public/data/region.geojson', import.meta.url), 'utf8'));
  assert.equal(geo.features.length, 1);
  assert.equal(geo.features[0].properties.shapeISO, 'RU-KGD');
  assert.ok(['Polygon','MultiPolygon'].includes(geo.features[0].geometry.type));
  const source = JSON.parse(await readFile(new URL('../public/data/boundary-source.json', import.meta.url), 'utf8'));
  assert.ok(source.boundaryLicense.includes('Open Database'));
});
