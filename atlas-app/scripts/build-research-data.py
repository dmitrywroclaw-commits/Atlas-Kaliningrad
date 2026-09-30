"""Convert the stage 2 research tables into map-ready records without discarding rows."""

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "Atlas Docs" / "atlas_kaliningrad_stage2_research_v0.2"
OUT = ROOT / "atlas-app" / "src" / "research-data.json"
PUBLIC = ROOT / "atlas-app" / "public" / "research"

FILES = {
    "settlements": "01_significant_places.md",
    "russian": "02_russian_army_battlefields.md",
    "ww2": "03_great_patriotic_war_places.md",
    "folklore": "04_myths_folklore.md",
    "literature": "05_literary_places.md",
}

CITY_GROUPS = {
    "chernyakhovsk": "syw_gross_jagersdorf_field syw_gross_jagersdorf_memorial syw_chernyakhovsk_plaque ww2_insterburg fol_insterburg_witch lit_frieda_jung",
    "bagrationovsk": "nap_preussisch_eylau_field nap_kregovskie_heights nap_three_generals nap_bagrationovsk_museum",
    "pravdinsk": "nap_friedland_field nap_mazovsky_grave nap_friedland_hospital",
    "nesterov": "ww1_stalluponen_field",
    "gusev": "ww1_gumbinnen_goldap_field ww1_bayonet_attack ww1_all_saints ww1_forgotten_war ww2_gumbinnen_capture ww2_gusev_memorial",
    "kaliningrad": "ww2_konigsberg_assault_area ww2_fort5 ww2_bunker ww2_pregel_crossing ww2_amalienau_linkup ww2_1200_guardsmen fol_konigsberg_underground fol_amber_room_castle fol_bunker_magic fol_homlins lit_hoffmann_birth lit_bobrowski_konigsberg lit_snegov_house lit_snegov_library lit_solzhenitsyn_east_prussia",
    "svetlogorsk": "ww2_rauschen lit_kuranov_svetlogorsk lit_dmitrovsky_library",
    "primorsk": "ww2_fischhausen",
    "baltiysk": "ww2_pillau ww2_pillau_mass_grave ww2_frische_nehrung",
    "mamonovo": "ww2_heiligenbeil_pocket",
    "znamensk": "ww2_wehlau_model lit_buida_znamensk",
    "rybachy": "fol_rossitten_cluster fol_neringa fol_heinrich_kunzen fol_rossitten_cat fol_dancing_forest_prediniya fol_dancing_forest_modern fol_swan_lake_princess lit_hoffmann_rossitten",
    "yantarny": "fol_jurate_kastytis fol_white_elk_flounder fol_anna_mine",
    "sovetsk": "lit_bobrowski_birth",
    "zelenogradsk": "lit_kuranov_library",
}
CITY_BY_ID = {item: city for city, ids in CITY_GROUPS.items() for item in ids.split()}

# Coordinates found in the existing prototype or its local OSM export.
# Other records use an explicit approximate settlement anchor.
KNOWN = {
    "syw_gross_jagersdorf_field": [21.5214, 54.6242],
    "nap_three_generals": [20.6423976, 54.3840218],
    "nap_bagrationovsk_museum": [20.6406611, 54.3873904],
    "ww2_fort5": [20.444718, 54.7526979],
    "ww2_bunker": [20.5096902, 54.7131417],
    "ww2_1200_guardsmen": [20.4902324, 54.7112029],
    "ww2_gusev_memorial": [22.1995219, 54.5905876],
    "fol_dancing_forest_prediniya": [20.9534617, 55.2679392],
    "fol_dancing_forest_modern": [20.9534617, 55.2679392],
    "fol_konigsberg_underground": [20.5095709, 54.7104457],
    "fol_amber_room_castle": [20.5095709, 54.7104457],
    "fol_insterburg_witch": [21.8067414, 54.6396478],
    "fol_bunker_magic": [20.5096902, 54.7131417],
    "lit_frieda_jung": [21.8101325, 54.6326621],
}


def rows(filename):
    for line in (DOCS / filename).read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells[0] == "id" or all(set(cell) <= {"-", ":"} for cell in cells):
            continue
        yield cells


def clean(value):
    return re.sub(r"`", "", value).replace("**", "")


def coordinates(value):
    found = re.search(r"(5[4-5]\.\d+)\s*,\s*(1[9]\.?\d*|2[0-2]\.\d+)", value)
    return [float(found.group(2)), float(found.group(1))] if found else None


settlements = []
for cells in rows(FILES["settlements"]):
    sid, name, historical, location, why, tags, status = cells
    position = coordinates(location)
    if not position:
        raise ValueError(f"Missing settlement coordinates: {sid}")
    settlements.append({
        "id": sid, "name": clean(name), "historicalName": clean(historical),
        "coordinates": position, "description": clean(why), "tags": clean(tags),
        "geoStatus": status, "document": FILES["settlements"],
    })
anchors = {item["id"]: item["coordinates"] for item in settlements}

records = []
for layer in ("russian", "ww2", "folklore", "literature"):
    for cells in rows(FILES[layer]):
        rid = cells[0]
        city = CITY_BY_ID.get(rid)
        if not city:
            raise ValueError(f"Unmapped research row: {rid}")
        if layer in ("russian", "ww2"):
            _, place, period, kind, description, location, status = cells
            title = place
            summary = description
        elif layer == "folklore":
            _, place, plot, kind, period, description, status = cells
            title = f"{place} · {plot}"
            summary = description
            location = place
        else:
            _, place, author, kind, description, location, status = cells
            title = f"{place} · {author}"
            summary = description
            period = author
        exact = KNOWN.get(rid)
        rough = coordinates(location)
        position = exact or rough or anchors[city]
        precision = "point" if exact and status in ("ready_point", "cluster") else "anchor"
        records.append({
            "id": rid, "cityId": city, "layer": layer, "name": clean(title),
            "description": clean(summary), "period": clean(period),
            "kind": clean(kind), "locationHint": clean(location),
            "geoStatus": status, "mapPrecision": precision,
            "coordinates": position, "document": FILES[layer],
        })

expected = {"russian": 15, "ww2": 16, "folklore": 15, "literature": 12}
assert len(settlements) == 26
assert {layer: sum(row["layer"] == layer for row in records) for layer in expected} == expected
assert len({row["id"] for row in records}) == len(records)

OUT.write_text(json.dumps({"settlements": settlements, "records": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PUBLIC.mkdir(exist_ok=True)
for filename in FILES.values():
    shutil.copyfile(DOCS / filename, PUBLIC / filename)
print(f"Wrote {len(settlements)} settlements and {len(records)} thematic records")
