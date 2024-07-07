'use strict';
import { ZOOM_LEVEL } from './assets/js/const.js';
/*global L:readonly*/

import genCountyHeatmap from './assets/js/county-heatmap.js';
import { drawMarker } from './assets/js/draw.js';
import { eHIDE_CITY_LABELS, eSHOW_CITY_LABELS } from './assets/js/events.js';
import init from './assets/js/init.js';
import NominatimJS from './assets/js/nominatim.js';

const map = await init();

// city labels show/hide
document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

const showCityMarkerPos = (lat, lon, city) => (e) => {
	const {lat: layerLat, lng: layerLon} = map.layerPointToLatLng(
		L.point(e.layerPoint)
	);

	// sanity check on layer conversion
	const useLat =
		layerLat.toFixed(1) == lat.toFixed(1) ? layerLat.toFixed(4) : lat;
	const useLon =
		layerLon.toFixed(1) == lon.toFixed(1) ? layerLon.toFixed(4) : lon;

	const txt = `'${city}': [${[useLat, useLon]}],`;
	console.log(txt);
	navigator.clipboard.writeText(txt);
};

const genMajorCityMarkers = async () => {
	/** @type {{lat: number; lon: number; city: string;}[]}} data */
	const data = await fetch('./data-csv/parsed_results.json').then((r) =>
		r.json()
	);
	const clusterGroup = L.markerClusterGroup({
		maxClusterRadius: 40,
	});
	const markers = data.map(({lat, lon, city}) => {
		const m = drawMarker(map, [lat, lon], city, {color: 'red'});
		m.on('click', showCityMarkerPos(lat, lon, city));
		return m;
	});
	clusterGroup.addLayers(markers);
	return clusterGroup;
};

const dataCache = {
	majorCities: await genMajorCityMarkers(),
};

const toggleMajorCities = () => {
	const {majorCities} = dataCache;
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
	if (!countyHeatmap) {
		countyHeatmap = await genCountyHeatmap();
	}
	showCountyHeatmap = !showCountyHeatmap;
	showCountyHeatmap
		? map.addLayer(countyHeatmap)
		: map.removeLayer(countyHeatmap);
};
document.querySelector('#county-heatmap').onclick = toggleCountyHeatmap;

function extractCoordFrom(input) {
	const regex = /(-?\d+\.\d+)(?:,?)\s*(-?\d+\.\d+)/;
	const match = input.match(regex);
	console.log(match);

	if (match) {
		const lat = parseFloat(match[1]);
		const lng = parseFloat(match[2]);
		return {lat, lng};
	} else {
		return null; // No coordinate pair found
	}
}

/**
 * @param {string} rawCoord
 * @param isJSON - tells the function to expect json instead of a string input
 * @returns {boolean} marker on success
 */
const pingMarker = (rawCoord, isJSON = false) => {
	if (!rawCoord) return;
	const latLng = isJSON
		? {lat: rawCoord.lat, lng: rawCoord.lng}
		: extractCoordFrom(rawCoord);
	if (!latLng) {
		alert('bad input');
		return;
	}
	const m = drawMarker(null, latLng, 'PING');
	map.addLayer(m);
	map.flyTo(latLng);
	console.log('drawing marker', m);

	let opacity = 1;
	const intv = setInterval(() => {
		opacity -= 0.1;
		m.setStyle({opacity});
	}, 500);
	setTimeout(() => {
		map.removeLayer(m);
		console.log('removing marker', m);
		clearInterval(intv);
	}, 4000);
	return m;
};

const pingInput = document.querySelector('#ping-coord');
pingInput.addEventListener('keydown', (e) => {
	if (e.code === 'Enter') {
		const clearVal = pingMarker(e.target.value);
		if (clearVal) {
			e.target.value = '';
		}
	}
});
document.querySelector('#ping-coord-enter').onclick = () => {
	const clearVal = pingMarker(pingInput.value);
	if (clearVal) {
		pingInput.value = '';
	}
};
document.querySelector('#ping-coord-clear').onclick = () => {
	pingInput.value = '';
};

let nominatim;
const nominatimMarker = async (search) => {
	if (!search) return;
	let clearVal;
	try {
		const results = await nominatim.search({q: search});
		if (results) {
			clearVal = true;
		}
		const markers = results.map((r) => pingMarker(r, true));
		if (results.length === 1) {
			map.panTo([results[0].lat, results[0].lng]);
			map.setZoom(ZOOM_LEVEL.tristate)
		} else if (results.length > 1) {
			const group = L.featureGroup(markers);
			map.fitBounds(group.getBounds().pad(0.5));
		} else {
			alert("no results")
		}
	} catch (e) {
		console.warn(e);
	}
	return clearVal;
};

const locationInput = document.querySelector('#lookup-location');
locationInput.addEventListener('keydown', async (e) => {
	if (!nominatim) {
		nominatim = new NominatimJS();
	}
	if (e.code === 'Enter') {
		if (await nominatimMarker(e.target.value)) {
			e.target.value = '';
		}
	}
});
document.querySelector('#lookup-location-enter').onclick = async () => {
	if (await nominatimMarker(locationInput.value)) {
		locationInput.value = '';
	}
};
document.querySelector('#lookup-location-clear').onclick = () => {
	locationInput.value = '';
};
