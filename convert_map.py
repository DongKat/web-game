import json

# Terrain type defaults for GameMap (defenseBonus, movementCost, passable)
TERRAIN_DEFAULTS = {
    "Grass":    {"defenseBonus": 0, "movementCost": 1, "passable": True},
    "Mountain": {"defenseBonus": 4, "movementCost": 4, "passable": True},
    "Lake":     {"defenseBonus": 0, "movementCost": 0, "passable": False},
    "River":    {"defenseBonus": 0, "movementCost": 2, "passable": True},
    "Road":     {"defenseBonus": 0, "movementCost": 1, "passable": True},
    "Bridge":   {"defenseBonus": 0, "movementCost": 1, "passable": True},
    "Forest":   {"defenseBonus": 2, "movementCost": 2, "passable": True},
}

# Maps team color string → numeric owner ID
TEAM_OWNER = {
    "Gray": 0,
    "Green": 1,
    "Blue": 2,
    "Red": 3,
    "Yellow": 4,
}

# Tiled encodes flip flags in the high bits of tile IDs — mask them off
TILED_FLIP_MASK = 0x1FFFFFFF

# Maps sample.json layer names → GameMap layer names
LAYER_NAME_MAP = {
    "Terrain": "Terrain",
    "Objects": "Object",
    "Vehicles": "Unit",
}

# Build sprite ID → full metadata entry lookup
sprite_by_id = {}

def index_entries(entries):
    for entry in entries:
        sprite_by_id[entry["id"]] = entry

with open("D:/OPSWAT/Sandbox/web-game/src/schema/KennySpriteMetadata.json", "r") as f:
    metadata = json.load(f)

for group in metadata["terrain"].values():
    index_entries(group)
for group in metadata["infrastructure"].values():
    index_entries(group)
index_entries(metadata["props"])
for group in metadata["buildings"].values():
    index_entries(group)
for group in metadata["units"].values():
    index_entries(group)
index_entries(metadata["ui"])
index_entries(metadata["status"]["health"])
index_entries(metadata["status"]["emotes"])
index_entries(metadata["effects"])

# Load and convert the sample map
with open("D:/OPSWAT/Sandbox/web-game/public/assets/maps/sample.json", "r") as f:
    sample_map = json.load(f)

output = {
    "width": sample_map["width"],
    "height": sample_map["height"],
    "layers": [],
}

for layer in sample_map["layers"]:
    src_name = layer["name"]
    dest_name = LAYER_NAME_MAP.get(src_name)
    if dest_name is None:
        print(f"Skipping unknown layer: {src_name}")
        continue

    converted_data = []
    for raw_id in layer["data"]:
        tile_id = raw_id & TILED_FLIP_MASK  # strip Tiled flip flags

        if tile_id == 0:
            converted_data.append(None)
            continue

        entry = sprite_by_id.get(tile_id)
        if entry is None:
            print(f"  Warning: unknown tile ID {tile_id} in layer '{src_name}', skipping")
            converted_data.append(None)
            continue

        sprite_type = entry.get("type", "")
        team = entry.get("team")
        owner = TEAM_OWNER.get(team, 0)

        if dest_name == "Terrain":
            entity_data = {"terrainType": sprite_type}
        elif dest_name == "Object":
            entity_data = {"buildingType": sprite_type, "owner": owner}
        elif dest_name == "Unit":
            entity_data = {"unitType": sprite_type, "owner": owner}
        else:
            converted_data.append(None)
            continue

        # importFromJson() calls JSON.parse() on each element, so serialize to string
        converted_data.append(json.dumps(entity_data))

    output["layers"].append({"name": dest_name, "data": converted_data})
    print(f"Converted layer '{src_name}' → '{dest_name}' ({len(converted_data)} tiles)")

with open("D:/OPSWAT/Sandbox/web-game/public/assets/maps/converted_sample.json", "w") as f:
    json.dump(output, f, indent=4)

print("Done.")
