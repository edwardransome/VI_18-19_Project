var markers = L.layerGroup();

$( document ).ready(function(){

	///////////////////////////
	//     load datasets     //
	///////////////////////////
	function json_loader(file_path){
		var jsonTemp = null;
		$.ajax({
			'async': false,
			'url': file_path,
			'success': function (data) {
				jsonTemp = data;
			}
		});
		return jsonTemp;
	}
	// load penguin dataset
	const data_penguins = json_loader("data/penguins_18_02_15.json")


	///////////////////////////
	//       init map        //
	///////////////////////////
	// The polar projection
	const EPSG3031 = new L.Proj.CRS(
		"EPSG:3031",
		"+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs", {
			origin: [-4194304, 4194304],
            resolutions: [
                8192.0,
                4096.0,
                2048.0,
                1024.0,
                512.0,
                256.0
            ],
            bounds: L.bounds(
                [-4194304, -4194304],
                [4194304, 4194304]
			)
		});

	const southWest = L.latLng(-38.94137277935882, -135);
	const northEast = L.latLng(-38.94137277935882, 45);
	const bounds = L.latLngBounds(southWest, northEast);
	
	// create the map
	antarctica_map = new L.Map('map', {
		crs: EPSG3031,
	    minZoom: 0,
	    maxZoom: 4, // because nasa data has only five zoom levels
		maxBounds: bounds
	});

	// config attributes for nasa data source
	const attribs = "Penguins' data &copy; <a href='http://www.penguinmap.com/mapppd' target='_blank'>" +
		"MAPPPD</a><br>Base Map &copy; <a href='https://wiki.earthdata.nasa.gov/display/GIBS' target='_blank'>" +
		"NASA EOSDIS GIBS</a>";
	const nasaUrl = 'https://gibs-{s}.earthdata.nasa.gov' +
		'/wmts/epsg3031/best/' +
		'{layer}/default/{tileMatrixSet}/{z}/{y}/{x}.{format}';
	
	// config attributes for blue marble layer
	const blueMarble = new L.tileLayer(nasaUrl, {
		attribution: attribs, 
		attributionControl: false,
	    tileSize: 512,
	    layer: "BlueMarble_ShadedRelief_Bathymetry",
	    tileMatrixSet: "500m",
	    format: "jpeg"
	});

	L.control.attribution({
		prefix: false,
		position: 'bottomleft'
	}).addTo(antarctica_map);
	
	// config attributes for graticule layer
	const graticule = new L.tileLayer(nasaUrl, {   
	    tileSize: 512,
	    layer: "Graticule",
	    tileMatrixSet: "250m",
	    format: "png"
	});

	// config attributes for coastline layer
	const coastline = new L.tileLayer(nasaUrl, {
	    tileSize: 512,
	    layer: "Coastlines",
	    tileMatrixSet: "250m",
	    format: "png"
	});

	// add nasa blue marble and graticule data to the map
	antarctica_map.setView(new L.LatLng(-90, 0), 0);
	antarctica_map.addLayer(blueMarble);
	antarctica_map.addLayer(graticule);
	antarctica_map.addLayer(coastline);
	
	// add default point data
	updateMarkers();


	///////////////////////////
	//      search site      //
	///////////////////////////
	const allSites = data_penguins.map(entry => entry.site_name);
	const uniqueSites = unique(allSites);

	// dropdown list of sites
	$("#search-site").autocomplete({
		source: uniqueSites,
		focus: function( event, ui ) {
			$( "#search-site" ).val( ui.item.label );
			return false;
		},
		select: function( event, ui ) {
			updateMarkers();
			// add reset button
			$("#clear-search").show();
		}
	});	


	///////////////////////////
	//     clear search      //
	///////////////////////////
	$('#clear-search').click(function() {
		$("#search-site").val("");
		updateMarkers();
		$("#clear-search").hide();
	});


	///////////////////////////
	//      year filter      //
	///////////////////////////
	$("#year-slider").on("input", function() {
		$("#year").html($(this).val());
		updateMarkers();
	})
	

	///////////////////////////
	//     types filter    //
	///////////////////////////
	const allTypes = data_penguins.map(entry => entry.count_type);
	const uniqueTypes = unique(allTypes);

	// build penguins type filter
	uniqueTypes.forEach(item => {
		if(item != ""){
			$("#pen-types-filter").append("<input type='checkbox' name='type' id='"+item+"' value='"+item+"' checked><label for='"+item+"'>"+item+"</label>");
		}
		updateMarkers();
	});

	$(".pentype-box").on("click", function() {
		updateMarkers();
	});


	///////////////////////////
	//     apply filters     //
	//    and add markers    //
	///////////////////////////

	function updateMarkers() {
		// data_penguins tmp format reminder:
		// site_name,site_id,cammlr_region,longitude_epsg_4326,latitude_epsg_4326,
		// common_name,day,month,year,season_starting,penguin_count,accuracy,count_type,vantage,reference

		// get user filter values
		let site = $("#search-site").val();
		let year = $("#year-slider").val();
		let type = $(".pentype-box input:checked").map(function() {
				return $(this)["0"].value
			}).toArray();
		

		// clear map from all markers
		markers.clearLayers();

		//apply filters
		if (site) {
			data_penguins.forEach(item => {
				if (item.site_name == site && item.year == year && $.inArray(item.count_type,type) > -1) {
					//console.log(item)
					addMarker(item);
				}
			})
		} else {
			// if no site is specified
			data_penguins.forEach(item => {
				if (item.year == year && $.inArray(item.count_type,type) > -1){
					addMarker(item)
				}
			});
		}
		
		// add markers layer to the map
		antarctica_map.addLayer(markers);
	}

	///////////////////////////
	//       helpers         //
	///////////////////////////

	// remove duplicate
	function unique(array) {
		return [...new Set(array)]
	}

	function addMarker(entry) {
		// build custom pin icon
		let thisIcon = L.icon({
			iconUrl : 'icons/' + 'pen_pin_macaroni' + '.png',
			iconSize: [35, 41],
			iconAnchor: [17.5, 41]
		})
		// build pin
		let marker = L.marker([entry.latitude_epsg_4326,entry.longitude_epsg_4326],{
			title: entry.site_id,
			icon: thisIcon
		});
		// add markers to the maker layer
		markers.addLayer(marker);	
	}

});



