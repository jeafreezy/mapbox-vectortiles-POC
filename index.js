const mapboxgl = require('mapbox-gl');
var mapContainer  = document.getElementById('map')
var cover = require('@mapbox/tile-cover');
var tilebelt = require('@mapbox/tilebelt');
var turf = require('@turf/turf')
var Quadkey = require('quadkeytools')


const fakeDB = [
  {
    country:'Nigeria',
    price:'10'
  },
  {
    country:'United State of America',
    price:'30'
  },
  {
    country:'India',
    price:'15'
  },
  {
    country:'United Kingdom',
    price:'25'
  }

]
var priceContainer = document.getElementById('totalPrice');
var countryContainer = document.getElementById('country');
var singlePriceContainer = document.getElementById('price');
var selectedTilesContainer = document.getElementById('selectedTiles');
let hoveredState = {'id':null};
let totalPrice = 0;
let selectedFeatures = 0; 
var clickedIds = [];

var ACCESS_TOKEN = '';

const map = new mapboxgl.Map({
  container: mapContainer, 
  style: 'mapbox://styles/jeafreezy/ckt73bgp20mrb17qua50oe07j', 
  center: [5.232,6.87599], 
  zoom:8,
  maxZoom:20,
  minZoom:4,
  accessToken:ACCESS_TOKEN
})

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


map.on('load', () => {
  map.addSource('tiles-geojson', {
    type: 'geojson',
    generateId: true,
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addSource('tiles-centers-geojson', {
    type: 'geojson',
    generateId: true,
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addLayer({
    id: 'tiles',
    source: 'tiles-geojson',
    type: 'line',
    paint: {
            
      'line-color': '#000',
      'line-width': 1,
      'line-opacity':1
  }
  });

  map.addLayer({

    id: 'tiles-shade',
    source: 'tiles-geojson',
    type: 'fill',
    paint: {
      'fill-color':'#fff',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
            0.3,
            0 
        ]
    }
  
  });


 
  map.addLayer({
    id: 'tiles-centers',
    source: 'tiles-centers-geojson',
    type: 'symbol',
    layout: {
      'text-field': ['format', ['get', 'text'], { 'font-scale': 0.8 }],
      'text-offset': [0, -1],
    },
    paint: {
      'text-color': '#fff',
      'text-color-transition': {
        duration: 0
      }
    }
  });

  //update with the tiles on load
  update();
});

//update with the tiles when user panning ends

map.on('moveend', update);



map.on('click','tiles-shade', async (e) => {

  features = map.queryRenderedFeatures(e.point, {layers: ['tiles-shade']});

  const quadkey = features[0].properties.quadkey
  
  //get the quadkey center
  quadkeyCenter = Quadkey.origin(quadkey);
  const {lat,lng} = quadkeyCenter;

  //geocode
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?&types=country&access_token=${ACCESS_TOKEN}`);
  const data = await response.json();

  //get the country from the response
  const clickedTileCountry = data.features[0].place_name;

  //update the country panel

  countryContainer.innerText = clickedTileCountry;

  //fetch price with country from DB. This will be a fetch or axios request to the API.

  let priceObject = fakeDB.find(countries=>countries.country === clickedTileCountry);
  
  if(priceObject){
    
    const price = Number(priceObject.price)

     //update the price container

    singlePriceContainer.innerText = String(price);
    

  //Interaction logic like former script

  hoveredState.id = quadkey;

  clickedIds.push({'id':quadkey,'clicked':'yes'})

  if (features.length > 0) {
      
    //if clicked is yes change color and make no

    if (hoveredState.id !== null){
        
        let idState = clickedIds.find(o=>o.id === hoveredState.id)
        
        if (idState.clicked === 'yes'){

            map.setFeatureState(

                { source: 'tiles-geojson', id: features[0].id },
                { hover: true }
            );


             //update total price and selected features

            selectedFeatures +=1
            totalPrice  += price

            let obj = clickedIds.find((o, i) => {
                if (o.id === hoveredState.id) {
                    clickedIds[i] = {id: hoveredState.id, clicked: 'no'};
                   
                    return true; // stop searching
                }
            });

           
            
        }else{
            
          map.setFeatureState(

            { source: 'tiles-geojson', id: features[0].id },
            { hover: false }

        );

        let obj = clickedIds.find((o, i) => {

            if (o.id === hoveredState.id) {
                clickedIds[i] = {id: hoveredState.id, clicked: 'yes'};
                
                return true; // stop searching
            }
        });

        //update total price and selected features
        selectedFeatures -=1
        totalPrice  -= price


        }


    }

  }
    
}else{

    alert(`No price for the ${clickedTileCountry} in the fake DB!`)
    window.location.reload()
  }

  selectedTilesContainer.innerHTML=`${selectedFeatures}/750`;
  priceContainer.innerHTML = `${totalPrice}$`

});



function update() {
  
  updateTiles();
}

function updateTiles() {


  //Update the tiles when user pans around and interact with the screen. Get the zoom and the extent geometry

  var extentsGeom = getExtentsGeom();
  var zoom = Math.ceil(map.getZoom());

  //using the tile cover library,create a tile for that zoom level and geometry

  tiles = cover.tiles(extentsGeom, {min_zoom: 20, max_zoom: zoom});

  //then we update the source with the tile created on the map

  map.getSource('tiles-geojson').setData({
    type: 'FeatureCollection',
    features: tiles.map(getTileFeature)
  });


  //This is to also update the label in the center

  map.getSource('tiles-centers-geojson').setData({
    type: 'FeatureCollection',
    features: tiles.map(getTileCenterFeatureAndUpdateCenterID)
  });
}

function getExtentsGeom() {

  //get the geometry of the extent of the screen

  var e = map.getBounds();
  var box = [
    e.getSouthWest().toArray(),
    e.getNorthWest().toArray(),
    e.getNorthEast().toArray(),
    e.getSouthEast().toArray(),
    e.getSouthWest().toArray()
  ].map(coords => {
    if (coords[0] < -180) return [-179.99999, coords[1]]
    if (coords[0] > 180) return [179.99999, coords[1]]
    return coords
  });

  return {
    type: 'Polygon',
    coordinates: [box]
  };
}

//This function is to get the quadkey for the tiles

function getTileFeature(tile) {

  var quadkey = tilebelt.tileToQuadkey(tile);

  var feature = {
    type: 'Feature',
    properties: {
      even: ((tile[0] + tile[1]) % 2 == 0),
      quadkey: quadkey
    },
    geometry: tilebelt.tileToGeoJSON(tile)
  };
  return feature;
}

function getTileCenterFeatureAndUpdateCenterID(tile) {
  
  //convert the tile to get the bounding box. Then get the center coordinate from the bbox so the ID label can sit right in the center of each tile

  var box = tilebelt.tileToBBOX(tile);
  var center = [
    (box[0] + box[2]) / 2,
    (box[1] + box[3]) / 2
  ];


  //get the quadkey for the tile to update the center as ID to display to user. Append 20 since it's zoom 20

  var quadkey = tilebelt.tileToQuadkey(tile);
  return {
    type: 'Feature',
    properties: {
      text: (
          quadkey, //this is the original quadkey
          quadkey.slice(4,) + '20' //to make it 15 digit,we can slice here easily.
                                  // Also we can decide to display random digits to user,but under the hood we'll be using the quadkey to perform query because it doesn't change
      )
    },
    geometry: {
      type: 'Point',
      coordinates: center
    }
  };
}

