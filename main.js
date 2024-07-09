'use strict';
/*global L:readonly*/

import genCountyHeatmap from './assets/js/county-heatmap.js';
import {eHIDE_CITY_LABELS, eSHOW_CITY_LABELS} from './assets/js/events.js';
import init from './assets/js/init.js';
import genMajorCityMarkers from './assets/js/mapping/major-city-markers.js';

const map = await init();

// city labels show/hide
document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

const dataCache = {
	majorCities: null,
	countyHeatmap: null
};

const toggleMajorCities = async () => {
	const {majorCities} = dataCache;
	if (!dataCache.majorCities) {
		dataCache.majorCities = await genMajorCityMarkers();
	}
	if (map.hasLayer(majorCities)) {
		map.removeLayer(majorCities);
		console.log('remove major cities');
	} else {
		map.addLayer(majorCities);
		console.log('add major cities');
	}
};
document.querySelector('#major-cities').onclick = toggleMajorCities;

let countyHeatmap;
let showCountyHeatmap = false;
const toggleCountyHeatmap = async () => {
	if (!dataCache.countyHeatmap) {
		dataCache.countyHeatmap = await genCountyHeatmap();
	}
	showCountyHeatmap = !showCountyHeatmap;
	showCountyHeatmap
		? map.addLayer(countyHeatmap)
		: map.removeLayer(countyHeatmap);
};
document.querySelector('#county-heatmap').onclick = toggleCountyHeatmap;
