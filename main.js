'use strict';
/*global L:readonly*/

import {INIT_ZOOM_LEVEL, ZOOM_LEVEL} from './assets/js/const.js';
import {bindRegionButtonsToMap} from './assets/js/bind-btns.js';
import {drawMarker} from './assets/js/draw.js';
import {eHIDE_CITY_LABELS, eSHOW_CITY_LABELS} from './assets/js/events.js';
import {getBoundsForBox} from './assets/js/util.js';
import CENTERS from './assets/js/zones/centers.js';
import USA_StateBoundaryData from './assets/js/geojson/usa-state-bounds.js';
import genCountyHeatmap from './assets/js/county-heatmap.js';

// INIT START
const isProd = !/localhost|127.0.0.1/.test(location.href);
document.querySelector('body').classList.add(isProd ? 'prod' : 'dev');

let map;
if (isProd) {
	map = L.map('map', {
		center: CENTERS.NA,
		zoom: ZOOM_LEVEL.country,
	});
} else {
	map = L.map('map', {
		center: CENTERS.NA_NE,
		zoom: INIT_ZOOM_LEVEL,
	});
}

const mapHUD = L.map('hud-map', {
	center: CENTERS.NA,
	zoom: 3,
	// NO ZOOM! ONLY LOOK!
	zoomControl: false,
	interactive: false,
	doubleClickZoom: false,
	dragging: false,
	boxZoom: false,
	scrollWheelZoom: false,
	tap: false,
	touchZoom: false,
});

L.control.scale().addTo(map);
L.control.scale().addTo(mapHUD);

// generate soft regions
const softRegions = {};
await fetch('./assets/js/zones/soft-regions.json')
	.then(r => r.json())
	.then(d => {
		// todo figure out why L.geoJson(d) won't render
		d.features.forEach(f => {
			if (!f.geometry.coordinates[0].length) return;
			const poly = L.polygon(f.geometry.coordinates[0]);
			softRegions[f.properties.region] = poly;
		});
		console.log('added soft regions');
	});

L.geoJson(USA_StateBoundaryData, {
	style: () => ({opacity: 0.5, weight: 2, fill: false}),
}).addTo(map);

bindRegionButtonsToMap(map, softRegions);

// START Interactive mapHUD viewbox
const viewBox = L.rectangle(getBoundsForBox(map), {
	interactive: true,
	draggable: true,
	zoomable: true,
	asDelta: false,
	zoom: INIT_ZOOM_LEVEL,
});
const viewBoxBackground = L.polygon(
	[getBoundsForBox(mapHUD), getBoundsForBox(viewBox)],
	{color: '#000000', className: 'no-click'}
);
viewBoxBackground.addTo(mapHUD);
viewBox.addTo(mapHUD);

viewBox.on('dragend', v => {
	const draggedTo = v.target.getCenter();
	map.setView(draggedTo);
});
viewBox.on('zoom', v => {
	map.setZoom(v.zoom);
});

const drawViewBox = () => {
	const mapBounds = getBoundsForBox(map);
	viewBox.setLatLngs(mapBounds);
	viewBoxBackground.setLatLngs([getBoundsForBox(mapHUD), mapBounds]);
};

map.on('moveend', drawViewBox);
map.on('zoomend', drawViewBox);
// END Interactive mapHUD viewbox

// open LatLng popup on rightclick. +shift => center of map / view
map.on('contextmenu', ({latlng, originalEvent}) => {
	let useLatLng = latlng;
	if (originalEvent.shiftKey) {
		useLatLng = map.getCenter();
	}

	const content = `${useLatLng.lat.toFixed(4)}, ${useLatLng.lng.toFixed(4)}`;

	if (originalEvent.ctrlKey) {
		navigator.clipboard.writeText(`[${content}],`);
	}

	L.popup({content}).setLatLng(useLatLng).openOn(map);

	originalEvent.preventDefault();
});

// add Earth images
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 10,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
}).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 10,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
}).addTo(mapHUD);

// INIT END

// city labels show/hide
document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

const showCityMarkerPos = (lat, lon, city) => e => {
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
	const data = await fetch('./data-csv/parsed_results.json').then(r =>
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

let majorCities;
let showMajorCities = false;
const toggleMajorCities = async () => {
	if (!majorCities) {
		majorCities = await genMajorCityMarkers();
	}
	showMajorCities = !showMajorCities;
	showMajorCities ? map.addLayer(majorCities) : map.removeLayer(majorCities);
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

const pingMarker = rawCoord => {
	const latLng = extractCoordFrom(rawCoord);
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
	return true;
};

const pingInput = document.querySelector('#ping-coord');
pingInput.addEventListener('keydown', e => {
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
