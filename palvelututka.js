// JavaScript source code
// Initialization stuff
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhYzI2MWMyMi1kZDcwLTRiOGYtYmY1MS1kN2E1Mzc3NDgzZTgiLCJpZCI6NDQ1OSwiaWF0IjoxNjAwMjYwMjY3fQ.diYc8wQUIW0V9Jpl3YzyrAgTWF6riB8J2_pxLnb9cKo';

// Global configuration variables 
var wmsURL = "https://kartta.hel.fi/ws/geoserver/avoindata/ows?SERVICE=WMS&";

//Function for creating a WMS imagery source, note that URL is presumed to be in a global variable
function createWMS(layerName) {
    var wms = new Cesium.WebMapServiceImageryProvider({
        url: wmsURL,
        parameters: {
            transparent: 'false',
            format: 'image/png'
        },
        layers: layerName,
        proxy: new Cesium.DefaultProxy('/proxy/'),
        credit: 'Helsinki, kaupunkimittaus'
    });
    return wms
}


// Toggle for click detection & spatial Query
var spatialSearchTrigger = false;

//storing original button bg color
var readyColor = "rgb(255, 64, 129)";
var busyColor = "rgb(70,70,70)";

function initializeViewPort() {
    //Starting location, centered around Helsinki, in WGS84 degrees
    var west = 24.86;
    var south = 60.14;
    var east = 24.99;
    var north = 60.19;
    var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(24.937, 60.135, 2500.0),
        orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-35.0),
            roll: 0.0
        }
    });

    //Go to starging position
    //viewer.camera.flyHome();

    //Further shadow configuration
    viewer.shadowMap.darkness = 0.5;
    viewer.shadowMap.softShadows = true;
    viewer.shadowMap.size = 2048;

    //Rendering resolution configuration
    viewer.resolutionScale = 1;
}

//Hardcoded for Palvelukartta-demo
var opaskartta = null;

function initializeMap() {
        if (opaskartta == null) {
            opaskartta = viewer.scene.imageryLayers.addImageryProvider(createWMS('avoindata:Opaskartta_Helsinki_harmaa'));
        }
        opaskartta.show = true;
        viewer.imageryLayers.raiseToTop(opaskartta);
}

//Function for creating a viewmodel, layername is passed through to WMS creator function
function createViewModel(layerName) {
    var viewModel = new Cesium.ProviderViewModel({
        name: layerName,
        iconUrl: Cesium.buildModuleUrl('../hki_logo_64.jpg'),
        tooltip: layerName,
        creationFunction: function () {
            var wm = createWMS(layerName);
            return wm
        }
    });
    return viewModel
}

function initializeInformationModel() {

    //Setting up terrain providers
    var realTerrain = new Cesium.CesiumTerrainProvider({ url: Cesium.IonResource.fromAssetId(1) });

    //Adding Helsinki 3D City Information model
    var tilesetHelsinkiInfo = viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: 'https://kartta.hel.fi/3d/datasource-data/e9cfc1bb-a015-4a73-b741-7535504c61bb/tileset.json',
            show: true,
            shadows: false,
            maximumScreenSpaceError: 4
        })
    );

    //Check whether the Helsinki tile is correctly loaded
    tilesetHelsinkiInfo.allTilesLoaded.addEventListener(function () {
        //Applying hotfix for Helsinki City Information model heights to comply with Cesium global terrain
        setHeightOffset(31, tilesetHelsinkiInfo);
        viewer.terrainProvider = realTerrain;
    });
}

// Prepare the UI for launching the search
function launchSearch() {
    document.getElementById("launchUI").style.visibility = "hidden";
    viewer._container.style.cursor = "crosshair";
    spatialSearchTrigger = true;
}

// Prepare the UI for having the search completed
function searchComplete() {

    if (viewer.entities._entities._array.length != 0) {

    spatialSearchTrigger = false;
    viewer._container.style.cursor = "default";
    var bbox = findEntityBounds();
    var buffer = 0.000001 //Buffer for bounding box, somewhat complex as in radians...
    var rectangle = new Cesium.Rectangle(bbox[2] - buffer, bbox[0] - buffer, bbox[3] + buffer, bbox[1] + buffer);
    viewer.camera.flyTo({
        destination: rectangle,
        duration: 5
    });
    document.getElementById("completeUI").style.visibility = "visible";
    document.getElementById("resetButton").style.visibility = "visible";
    document.getElementById("researchButton").style.visibility = "visible";
    }
    else {
        console.log("Nyt ei löytynyt mitään...");
        resetSearch();
    }
}

function resetSearch() {
    document.getElementById("completeUI").style.visibility = "hidden";
    document.getElementById("resetButton").style.visibility = "hidden";
    document.getElementById("researchButton").style.visibility = "hidden";
    document.getElementById("launchUI").style.visibility = "visible";
    destroyPlotPoints();

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(24.937, 60.135, 2500.0),
        orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-35.0),
            roll: 0.0,
            duration: 5
        }
    });
}

function plotServiceMapUnits(objectToPlot) {
    if (objectToPlot.name.fi != null) { name = objectToPlot.name.fi; } else { name = ""; }

    //String cleaning, required in this interface...
    name = name.replace("\u00AD", "");

    var lat = objectToPlot.location.coordinates[0];
    var lon = objectToPlot.location.coordinates[1];
    if (objectToPlot.description != null) { var descriptionText = objectToPlot.description.fi; } else { descriptionText = ""; }

    if (viewer.entities.getById(objectToPlot.id) == null) {

        // Assembling the description text object
        var descriptionTextAssembly = "";
        descriptionTextAssembly = "<b><u>" + name + "</u></b><br /><br />" + descriptionText;

        // Adding URL, email and street address, if they exist
        if (objectToPlot.street_address != null) {
            descriptionTextAssembly = descriptionTextAssembly + "<br /> <br /> <b>Katuosoite: </b>" + objectToPlot.street_address.fi + "<br />";
        }
        if (objectToPlot.www != null) {
            descriptionTextAssembly = descriptionTextAssembly + "<br /> <b>www: </b><a target='_blank' href='" + objectToPlot.www.fi + "'>" + objectToPlot.www.fi + "</a><br />";
        }
        if (objectToPlot.email != null) {
            descriptionTextAssembly = descriptionTextAssembly + "<br /> <b>email: </b><a href='mailto:" + objectToPlot.email + "'>" + objectToPlot.email + "</a><br />";
        }
       
        var type = 0;
        if (objectToPlot.contract_type != null) {
            if (objectToPlot.contract_type.id == "municipal_service") {
                type = Cesium.Color.BLUE;
            } else if (objectToPlot.contract_type.id == "private_service") {
                type = Cesium.Color.ORANGE;
            } else if (objectToPlot.contract_type.id == "service_by_municipally_owned_company") {
                type = Cesium.Color.MEDIUMTURQUOISE;
            } else {
                type = Cesium.Color.SILVER;
            }
        } else {
            type = Cesium.Color.SILVER;
        }

        descriptionTextAssembly = descriptionTextAssembly + "<br/><i>Kohteen tunniste: " + objectToPlot.id + "</i>";

        var entity = viewer.entities.add({
            name: name,
            id: objectToPlot.id,
            description: descriptionTextAssembly,
            position: Cesium.Cartesian3.fromDegrees(lat, lon),
            point: {
                pixelSize: 10,
                color: type,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                heightReference: 'RELATIVE_TO_GROUND',
                disableDepthTestDistance: Number.POSITIVE_INFINITY

            },
            label: {
                text: name,
                font: '12pt sans-serif',
                style: Cesium.LabelStyle.FILL,
                outlineWidth: 0,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                heightReference: 'RELATIVE_TO_GROUND',
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                backgroundColor: new Cesium.Color(1, 1, 1, 0.8),
                backgroundPadding: new Cesium.Cartesian2(10, 10),
                showBackground: true,
                fillColor: new Cesium.Color(0, 0, 0, 1),
                translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0)
            }
        });
    }
    else {
        console.log("Entity already exists.");
    }
}

function destroyPlotPoints() {
    viewer.entities.removeAll();
}

function findEntityBounds() {
    var i = 0;

    //These hold the bounding box
    var latMIN = 0;
    var latMAX = 0;
    var lonMIN = 0;
    var lonMAX = 0;

    while (i < viewer.entities._entities._array.length) {

        //Assemble lat & lon from entity position
        var posDeg = Cesium.Cartographic.fromCartesian(viewer.entities._entities._array[i].position._value);

        //First run
        if (i == 0) {
            latMIN = posDeg.latitude;
            latMAX = posDeg.latitude;
            lonMIN = posDeg.longitude;
            lonMAX = posDeg.longitude;
        }
        
        if (posDeg.latitude < latMIN) {
            latMIN = posDeg.latitude;
        }

        if (posDeg.latitude > latMAX) {
            latMAX = posDeg.latitude;
        }

        if (posDeg.longitude < lonMIN) {
            lonMIN = posDeg.longitude;
        }

        if (posDeg.longitude > lonMAX) {
            lonMAX = posDeg.longitude;
        }
      
        i++;
    }
    return [latMIN, latMAX, lonMIN, lonMAX];
}

var ServiceMapSpatialURL = "https://api.hel.fi/servicemap/v2/unit/";
var ServiceMapSpatialCollection = [];
function queryServiceMapSpatial(lat,lon) {
    var ServiceMapUnitJSON;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            ServiceMapUnitJSON = JSON.parse(xhttp.responseText);
            var i = 0;
            while (i < ServiceMapUnitJSON.results.length) {
                if (ServiceMapUnitJSON.results[i].location != null) {
                   plotServiceMapUnits(ServiceMapUnitJSON.results[i]);
                }
                else {
                    console.log("Could not plot due to missing location");
                }
                i++;
            }
            if (i == ServiceMapUnitJSON.results.length) {
                console.log("All sent to plotting, now commencing camera movement...");
                //Tell UI were done here.
                searchComplete();
            }
        }
    };
    //Build Query URL

    CompleteQueryURL = ServiceMapSpatialURL + "?lat=" + lat + "&lon=" + lon + "&distance=1000" + "&page_size=25";

    xhttp.open("GET", CompleteQueryURL, true);
    console.log("API request sent on:" + CompleteQueryURL);
    xhttp.send();
}
