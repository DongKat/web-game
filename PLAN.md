# Get advanced war asset as placeholders
- Upload to this repo
# Tag the assets
- Give name to each tile file

# Feature 1: Map editor
- Allow create maps, using map tiles, building tiles
- Design cursor/pointer 
## Design
Map and MapEditor
``` Python
# An object to hold information about what's on the map
class Map: # <- Focus on this
    # A 1D array or 2D array
    GridObject grids

    # These 3 can be refactored into something simpler
    # Add a tile/terrain 
    def addMapTile(MapTile):
        # Add the tile
        pass
    
    def addBuildings(Building, Color):
        pass
    
    def addUnit(Unit, Color):
        pass
    
    def removeStuffs():
        pass

# A dedicated object for manipulate, interact with Map
class MapEditor:
    # Provide interfaces

```
## Requirements
- Show a map
- Units in idle animation
- The cursor can move around, no need for clicking/selecting

