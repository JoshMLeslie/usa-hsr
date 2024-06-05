'use strict';
/*global L:readonly*/

import {
	INIT_ZOOM_LEVEL,
	isProd,
	ZOOM_LEVEL
} from './assets/js/const.js';
import { bindRegionButtonsToMap } from './assets/js/bind-btns.js';
import { drawMarker } from './assets/js/draw.js';
import { eHIDE_CITY_LABELS, eSHOW_CITY_LABELS } from './assets/js/events.js';
import { getBoundsForBox } from './assets/js/util.js';
import CENTERS from './assets/js/zones/centers.js';

// INIT START
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

bindRegionButtonsToMap(map);

// START Interactive mapHUD viewbox

const viewBox = L.rectangle(getBoundsForBox(map), {
	interactive: true,
	draggable: true,
	zoomable: true,
	asDelta: false,
	zoom: INIT_ZOOM_LEVEL,
});
viewBox.addTo(mapHUD);
viewBox.on('dragend', v => {
	const draggedTo = v.target.getCenter();
	map.setView(draggedTo);
});
viewBox.on('zoom', v => {
	map.setZoom(v.zoom);
});

const drawViewBox = () => viewBox.setLatLngs(getBoundsForBox(map));

map.on('moveend', drawViewBox);
map.on('zoomend', drawViewBox);
// END Interactive mapHUD viewbox

// open LatLng popup on rightclick. +shift => center of map / view
map.on('contextmenu', e => {
	let useLatLng = e.latlng;
	if (e.originalEvent.shiftKey) {
		useLatLng = map.getCenter();
	}

	L.popup({content: useLatLng.toLocaleString()})
		.setLatLng(useLatLng)
		.openOn(map);

	e.originalEvent.preventDefault();
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

// INIT UI
map.setView(CENTERS.NA_NE, 6);
// drawZone(ZONE_NE, COORDS);

document.querySelector('#show-cities').onclick = async () => {
	/** @type {{lat: number; lon: number; city: string;}[]}} data */
	const data = await fetch('./data-csv/parsed_results.json').then(r =>
		r.json()
	);
	const markers = data.map(({lat, lon, city}) =>
		drawMarker(map, [lat, lon], city, {color: 'red'})
	);
	const clusterGroup = L.markerClusterGroup({
		maxClusterRadius: 40,
	});
	clusterGroup.addLayers(markers);
	console.log(clusterGroup);
	map.addLayer(clusterGroup);
};
