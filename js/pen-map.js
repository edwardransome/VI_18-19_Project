var markers = L.layerGroup();
		
$(document).ready(function(){
	// $("body").removeClass("loading");
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
	const data_comnap = json_loader("data/comnap_antarctic_facilities_18_10_18.json")
	
	

	/**
	 * This heatmap contains only the data that had a lot of datapoints, and that were close together (from the years perspective). It was completed with interpolation
	 * to make the rendering easy.
	 * 
	 * Store the site name and location, which location and then the penguin count from the years 1957 to 2017, with the transparency the marker should be drawn with.
	 * When the transparency is 10, it means usually interpolated data
	 * When the transparency is 0, it is the correct data
	 * When the transparency is going from 100 to 10, we reported the value from the closest known year
	 */
	const data_heatmap = json_loader("data/penguins_heatmap.json")


	///////////////////////////
	//           UX          //
	///////////////////////////
	$(".sidebar-close").on("click", function() {
		$("#sidebar-open").show('slide', { direction: 'right', easing: 'swing' }, 700);
		if (!$('.advanced-options').is("hidden")){
			$('.advanced-options').hide('slide', { direction: 'right', easing: 'swing' }, 500);
		}
		$('.filters').hide('slide', { direction: 'right', easing: 'swing' }, 500, function(){
			
			});
	});

	$("#sidebar-open").on("click", function() {
		$("#sidebar-open").hide('slide', { direction: 'right', easing: 'swing' }, 500);
		$('.filters').show('slide', { direction: 'right', easing: 'swing' }, 500, function(){
		});
	});

	let advanced_toggle = false;
	$(".advanced-toggle").on("click", function() {
		advanced_toggle = !advanced_toggle;
		if(advanced_toggle){
			$('.filters').hide('slide',{direction: 'left'}, 0, function(){
				$('.advanced-options').show('slide',{direction: 'left'}, 0);
			});
		}else{
			$('.advanced-options').hide('slide', 0, function(){
				$('.filters').show('slide', 0);
			});
		}
	});


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
		"MAPPPD</a><br>Humans' data &copy; <a href='https://www.comnap.aq/SitePages/Home.aspx' target='_blank'>" +
		"Polar Geospatial Center</a><br>Base Map &copy; <a href='https://wiki.earthdata.nasa.gov/display/GIBS' target='_blank'>" +
		"NASA EOSDIS GIBS</a>";
	const nasa_layer_url = 'https://gibs-{s}.earthdata.nasa.gov' +
		'/wmts/epsg3031/best/' +
		'{layer}/default/{tileMatrixSet}/{z}/{y}/{x}.{format}';
	
	// config attributes for blue marble layer
	const blueMarble = new L.tileLayer(nasa_layer_url, {
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
	const graticule = new L.tileLayer(nasa_layer_url, {   
	    tileSize: 512,
	    layer: "Graticule",
	    tileMatrixSet: "250m",
	    format: "png"
	});

	// config attributes for coastline layer
	const coastline = new L.tileLayer(nasa_layer_url, {
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
	update_markers();


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
			update_markers();
			// add reset button
			$("#clear-search").show();
		}
	});	


	///////////////////////////
	//     clear search      //
	///////////////////////////
	$('#clear-search').click(function() {
		$("#search-site").val("");
		update_markers();
		$("#clear-search").hide();
	});


	///////////////////////////
	//     category filter   //
	///////////////////////////
	$('#category-filter').change(function() {
		update_markers();
	});


	///////////////////////////
	//      year filter      //
	///////////////////////////
	let current_user_timout;
	$("#year-slider").on("input", function() {
		display_sorted_years();
		clearTimeout(current_user_timout);
		current_user_timout = setTimeout(function(){update_markers();}, 300);
	})

	$("#year-slider-second").on("input", function() {
		display_sorted_years();
		clearTimeout(current_user_timout);
		current_user_timout = setTimeout(function(){update_markers();}, 300);
	})

	function display_sorted_years(){
		let year_1 = $("#year-slider").val();
		$("#year").html(year_1);
		let year_2 = 0;
		if ($("#years-range").is(":checked")){
			year_2 = $("#year-slider-second").val();
			$("#year").html((year_1 < year_2) ? year_1 : year_2);
			$("#year-second").html((year_1 > year_2) ? year_1 : year_2);
		}
	}

	$("#years-range").change(function() {
		if ($("#years-range").is(":checked")){
			display_sorted_years();
			$("#year-slider-second").show(0);
			$("#year-to-label").show(0);
			$("#year-second").show(0);
			$("#for-years-label").text("For the given years from:")
		}else{
			$("#year-slider-second").hide(0);
			$("#year-to-label").hide(0);
			$("#year-second").hide(0);
			$("#for-years-label").text("For the given year:")
		}
	})
	

	///////////////////////////
	//     types filter    //
	///////////////////////////
	const all_types = data_penguins.map(entry => entry.count_type);
	const unique_types = unique(all_types);

	// build penguins type filter
	unique_types.forEach(item => {
		if(item != ""){
			$("#pen-types-filter").append("<input type='checkbox' name='type' id='"+item+"' value='"+item+"' checked><label for='"+item+"'>"+item+"</label>");
		}
		update_markers();
	});

	$(".pen-types-box").on("click", function() {
		update_markers();
	});


	///////////////////////////
	//     species filter    //
	///////////////////////////
	const all_species = data_penguins.map(entry => entry.common_name);
	const unique_species = unique(all_species);

	// build penguins type filter
	let counter = 0
	unique_species.forEach(item => {
		if(item != ""){
			item_regex = item.replace(/ /g,'_').replace(/é/g,'e');
			if(counter++ > 1){$("#pen-species-filter").append("<br/>");counter=0;}
			$("#pen-species-filter").append("<input type='checkbox' name='type' id='"+item_regex+"' value='"+item_regex+"' checked><label for='"+item_regex+"'>"+item+"</label>");
		}
		update_markers();
	});

	$(".pen-species-box").on("click", function() {
		update_markers();
	});

	///////////////////////////
	//      humans filter    //
	///////////////////////////
	const all_human_fac = data_comnap.map(entry => entry.fac_type);
	const unique_human_fac= unique(all_human_fac);

	// build humans facitlities filter
	counter = 0
	unique_human_fac.forEach(item => {
		if(item != ""){
			if(counter++ > 2){$("#human-facilities-filter").append("<br/>");counter=0;}
			$("#human-facilities-filter").append("<input type='checkbox' name='type' id='"+item+"' value='"+item+"' checked><label for='"+item+"'>"+item+"</label>");
		}
		update_markers();
	});

	$(".human-facilities-box").on("click", function() {
		update_markers();
	});


	///////////////////////////
	//     map elements      //
	///////////////////////////
	$(".mapelements-box").on("click", function() {
		if ($('#coastline-cb').is(":checked")) {
			antarctica_map.addLayer(coastline);
		}
		else {
			antarctica_map.removeLayer(coastline);
		}
		
		if ($('#grid-cb').is(":checked")) {
			antarctica_map.addLayer(graticule);
		}
		else{
			antarctica_map.removeLayer(graticule);
		}
	});


	///////////////////////////
	//     apply filters     //
	//    and add markers    //
	///////////////////////////

	function update_markers() {
		// data_penguins tmp format reminder:
		// site_name,site_id,cammlr_region,longitude_epsg_4326,latitude_epsg_4326,
		// common_name,day,month,year,season_starting,penguin_count,accuracy,count_type,vantage,reference

		// get user filter values
		let category = $("#category-filter").val();
		let site = $("#search-site").val();
		let year = $("#year-slider").val();
		let year_second = $("#year-slider-second").val();
		let types = $(".pen-types-box input:checked").map(function() {
				return $(this)["0"].value
			}).toArray();
		let species = $(".pen-species-box input:checked").map(function() {
				return $(this)["0"].value
			}).toArray();
		let humans = $(".human-facilities-box input:checked").map(function() {
			return $(this)["0"].value
		}).toArray();
		
		
		
		// clear map from all markers
		markers.clearLayers();

		// Raw data markers
		if(category == "raw") {
			// apply filters
			for (var i = 0, len = data_penguins.length; i < len; i++) {
				let item = data_penguins[i];
				if (site){
					if(item.site_name == site){generic_pen_years_checker(item)}
				}else{generic_pen_years_checker(item)}
			}

			for (var i = 0, len = data_comnap.length; i < len; i++) {
				let item = data_comnap[i];
				if (item.year_est <= year){
					if($.inArray(item.fac_type,humans) > -1){add_hum_marker(item)}
				}
			}

			// add markers layer to the map
			antarctica_map.addLayer(markers);
		
		// Heatmap data markers
		}else if(category == "heatmap") {
			// Show aditionnal controls and informations
			data_heatmap.forEach(item => {
				add_heatmap_marker(item)
			});
			
		}

		function generic_pen_makers(item){
			if($.inArray(item.common_name.replace(/ /g,'_').replace(/é/g,'e'),species) > -1){
				if($.inArray("empty",types) > -1 && item.penguin_count == 0){add_pen_marker(item)}
				if($.inArray(item.count_type,types) > -1 && item.penguin_count > 0){add_pen_marker(item)}
			}
		}

		function generic_pen_years_checker(item){
			if ($("#years-range").is(":checked")){
				if (item.year <= year && item.year >= year_second){generic_pen_makers(item)}
			}else{
				if (item.year == year){generic_pen_makers(item)}
			}
		}
	}

	

	function add_heatmap_marker(entry) {
		// TODO: Render the marker from the correct year (item data start at year 1957 and ends at 2017), scale it depending on the data value to
		// represent the actual penguin count, and apply the transparency in % (and maybe change color based on it) to represent missing or interpolated data
	}

	///////////////////////////
	//       helpers         //
	///////////////////////////

	// remove duplicate
	function unique(array) {
		return [...new Set(array)]
	}

	async function asyncForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
		  await callback(array[index], index, array);
		}
	  }

	function add_pen_marker(entry) {
		// build custom pin icon
		let pen_type = entry.count_type;
		if(entry.penguin_count == 0){pen_type="empty"}
		let pen_species = entry.common_name.replace(/ /g,'_').replace(/é/g,'e');
		let size_factor = entry.penguin_count / 60000
		let size_x = (35*size_factor < 35) ? 35 : 35*size_factor;
		let size_y = (41*size_factor < 41) ? 41 : 41*size_factor;

		let pinIcon = L.icon({
			iconUrl : 'icons/pen_pin_'+pen_type+'_'+pen_species+'.png',
			iconSize: [size_x, size_y],
			iconAnchor: [size_x/2, size_y],
			popupAnchor: [0, -5]
		})
		// build pin
		let marker = L.marker([entry.latitude_epsg_4326,entry.longitude_epsg_4326],{
			title: entry.site_name,
			icon: pinIcon
		});

		// bind marker details to the marker
		marker.bindPopup(add_pen_marker_details(entry));

		// add markers to the maker layer
		markers.addLayer(marker);
	}

	function add_pen_marker_details(entry) {
		let year = (entry.year == null) ? "????" : entry.year;
		let month = (entry.month == null) ? "??" : entry.month;
		let day = (entry.day == null) ? "??" : entry.day;
		let name = "<h2>" + entry.site_name + " (" + entry.site_id + ")" + "</h2>";
		let position = "<li><span>Latitude: </span>:" + entry.latitude_epsg_4326 +"</li><span>Longitude: </span>"+ entry.longitude_epsg_4326 + "</li>";
		let date = "<li><span>Date of record: </span>" + day +"/"+ month +"/"+ year + "</li>";
		let accuracy = "<li><span>Record accuracy: </span>" + entry.accuracy + "</li>";
		let species = "<li><span>Penguin species: </span>" + entry.common_name + "</li>";
		let type = "<li><span>Penguin type: </span>" + entry.count_type + "</li>";
		let amount = "<li><span>Individuals: </span>" + entry.penguin_count + "</li>";
		let starting_year = "<li><span>Season starting year: </span>" + entry.season_starting + "</li>";
		let reference = "<h3><span>Reference:</span></h3>" + entry.reference;
		
		return name + "<ul>" + position + date + starting_year + accuracy + species + type + amount +"</ul>"+reference;
	}

	function add_hum_marker(entry) {
		// build custom pin icon
		let size_x = 35;
		let size_y = 41;

		let pinIcon = L.icon({
			iconUrl : 'icons/hum_'+'default'+'.png',
			iconSize: [size_x, size_y],
			iconAnchor: [size_x/2, size_y],
			popupAnchor: [0, -5]
		})
		// build pin
		let marker = L.marker([entry.lat_dd,entry.lon_dd],{
			title: entry.name_eng,
			icon: pinIcon
		});

		// bind marker details to the marker
		marker.bindPopup(add_hum_marker_details(entry));

		// add markers to the maker layer
		markers.addLayer(marker);
	}

	function add_hum_marker_details(entry) {
		let year = (entry.year_est == null) ? "????" : entry.year_est;
		let name = "<h2>" + entry.name_off + " (" + entry.operator_1 + ")" + "</h2>";
		let fac = "<li><span>Facility type: </span>" + entry.fac_type +"</li>";
		let position = "<li><span>Latitude: </span>:" + entry.lat_dd +"</li><span>Longitude: </span>"+ entry.lon_dd + "</li>";
		let date = "<li><span>Year of installation: </span>" + year +"</li>";
		let season = "<li><span>Season: </span>" + entry.fac_seas + "</li>";
		let status = "<li><span>Status: </span>" + entry.fac_stat + "</li>";
		let photo = (entry.photo_url == null) ? "no picture" : "<h3><span>Photo:</span></h3><br/><div class='fac-img'><img src='" + entry.photo_url + "'></div>";
		
		return name + "<ul>" + fac +position + date + season + status +"</ul>"+photo;
	}
	$("body").addClass("loading");
	$("body").removeClass("loading");

});



