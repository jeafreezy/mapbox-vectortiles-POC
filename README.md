***How to install mapbox-tilesets GDAL and Rasterio on Windows***

- Create a virtual env using pipenv or virtualenv
- Activate the venv
- Download the wheels matching your python and windows version from https://www.lfd.uci.edu/~gohlke/pythonlibs/. Use python --version in CDM to check your python version
- pip install path/to/downloaded wheels
- pip install mapbox-tilesets
- create token in mapbox account with tileset-list,create checked
- store access token in the env file

**Steps**

- Created a square grid in QGIS
- Export as shp
- Convert to line delimited geojson with ogr2ogr (ogr2ogr -f GeoJSONSeq ./filepath ./sourcepath)
- Created a tileset source (tilesets upload-source jeafreezy grid .\grid.geojson.ld --token=TOKEN)
response = {"id": "mapbox://tileset-source/jeafreezy/grid", "files": 1, "source_size": 419103, "file_size": 419103}
- write a recipe
- create a new tileset - (tilesets create jeafreezy.grid  --recipe grid-recipe.json --name "mvt grid" --token=TOKEN)
- publish tileset to mapbox (tilesets publish jeafreezy.grid --token=TOKEN)
- access url in mapbox studio
- connect to mapbox gl js as source
- did some other logics on features in JS
