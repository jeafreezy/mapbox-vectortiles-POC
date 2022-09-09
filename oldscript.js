var mapContainer  = document.getElementById('map')
var priceContainer = document.getElementById('totalPrice')
var singlePriceContainer = document.getElementById('price')
var selectedTilesContainer = document.getElementById('selectedTiles')

const map = new mapboxgl.Map({
    container: mapContainer, 
    style: 'mapbox://styles/jeafreezy/ckt73bgp20mrb17qua50oe07j', 
    center: [5.232,6.87599], 
    minZoom:16,
    zoom:17,
    maxZoom:20,
    accessToken:''
})

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


let hoveredState = {'id':null};
let totalPrice = 0;
let selectedFeatures = 0; 
var clickedIds = [];
let pricePerTile  = 0;

map.on('load',()=>{

    map.addSource('grids', {
        'type': 'vector',
        'url': 'mapbox://jeafreezy.grid_layer'
    });
    
    map.addSource('tiles-geojson', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    
      map.addSource('tiles-centers-geojson', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

    map.addLayer({

        'id': 'fills',
        'type': 'fill',
        'source': 'grids',
        'source-layer':'grid_layer',
        'paint': {
            'fill-color': '#fff',
            'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
                0.6,
                0.1
            ]
        }
    });

    map.addLayer({

        id:'grids',
        'source': 'grids',
        'source-layer':'grid_layer',
        'layout':{},
        type:'line',
        'paint': {
            
            'line-color': '#000',
            'line-width': 0.2,
            'line-opacity':0.8
        }
        
    });
   
    //Add a new layer to laabel the grids
    map.addLayer({
        
        'id': 'label',
        'type': 'symbol',
        'source': 'grids',
        'source-layer': 'grid_layer',
        'layout': {
        'text-field': ['get', 'id'],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.5,
        'text-justify': 'auto',
        }
    });
        

    map.on('click', 'fills', (e) => {

        hoveredState.id = e.features[0].id;
        clickedIds.push({'id':hoveredState.id,'clicked':'yes'})
        pricePerTile = e.features[0].properties.price;
        if (e.features.length > 0) {
            
            //if clicked is yes change color and make no

            if (hoveredState.id !== null){
                
                let idState = clickedIds.find(o=>o.id === hoveredState.id)
                
                if (idState.clicked === 'yes'){

                    map.setFeatureState(

                        { source: 'grids', id: hoveredState.id,sourceLayer:'grid_layer' },
        
                        { hover: true }
                    );


                     //update total price and selected features
                    selectedFeatures +=1
                    totalPrice  += e.features[0].properties.price

                    let obj = clickedIds.find((o, i) => {
                        if (o.id === hoveredState.id) {
                            clickedIds[i] = {id: hoveredState.id, clicked: 'no'};
                           
                            return true; // stop searching
                        }
                    });

                   
                    
                }else{
                    
                    map.setFeatureState(
    
                        { source: 'grids', id: hoveredState.id,sourceLayer:'grid_layer' },
        
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
                    totalPrice  -= e.features[0].properties.price


                }
        

            }

    
            
        }  
        // Find all features in one source layer in a vector source
        const features = map.querySourceFeatures('grids', {
            sourceLayer: 'grid_layer'
        });

        selectedTilesContainer.innerHTML=`${selectedFeatures}/${features.length/2}`;
        singlePriceContainer.innerHTML = `${pricePerTile}$`
        priceContainer.innerHTML = `${totalPrice}$`
       
    
        });       


});
