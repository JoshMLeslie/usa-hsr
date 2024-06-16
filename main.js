'use strict';
/*global L:readonly*/

import {INIT_ZOOM_LEVEL, ZOOM_LEVEL} from './assets/js/const.js';
import {bindRegionButtonsToMap} from './assets/js/bind-btns.js';
import {drawMarker} from './assets/js/draw.js';
import {eHIDE_CITY_LABELS, eSHOW_CITY_LABELS} from './assets/js/events.js';
import {getBoundsForBox} from './assets/js/util.js';
import CENTERS from './assets/js/zones/centers.js';
import USA_StateBoundaryData from './assets/js/geojson/usa-state-bounds.js';
import USA_CountyData from './assets/js/geojson/us_county_data_pop.js';
import Rainbow from './assets/js/lib/rainbow.js';

// INIT START
const isProd = !location.href.includes('localhost');
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

// TODO state boundary highlighting per major zone (NE, SE, GLakes, etc.)
// see https://leafletjs.com/examples/choropleth/
L.geoJson(USA_StateBoundaryData, {
	style: () => ({opacity: 0.5, weight: 2, fill: false}),
}).addTo(map);

bindRegionButtonsToMap(map);

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

const genMajorCityMarkers = async () => {
	/** @type {{lat: number; lon: number; city: string;}[]}} data */
	const data = await fetch('./data-csv/parsed_results.json').then(r =>
		r.json()
	);
	const markers = data.map(({lat, lon, city}) => {
		const m = drawMarker(map, [lat, lon], city, {color: 'red'});
		m.on('click', e => {
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
		});
		return m;
	});
	const clusterGroup = L.markerClusterGroup({
		maxClusterRadius: 40,
	});
	clusterGroup.addLayers(markers);
	return clusterGroup;
};

const majorCities = await genMajorCityMarkers(); // todo: not await

let showMajorCities = false;
document.querySelector('#major-cities').onclick = () => {
	showMajorCities = !showMajorCities;
	if (!showMajorCities) {
		map.removeLayer(majorCities);
	} else {
		map.addLayer(majorCities);
	}
};

const genCountyHeatmap = async () => {
	// 	range: [43, 9663345]

	const rainbow = new Rainbow({
		colors: [
			'#21d452',
			'#21d48e',
			'#21d4cb',
			'#217ad4',
			'#3a21d4',
			'#68d421',
			'#b3d421',
			'#cd21d4',
			'#d49d21',
			'#d46a21',
		],
		range: [43, 9663345],
	});

	return new Promise((res, rej) => {
		try {
			res(
				L.geoJson(USA_CountyData, {
					style: ({properties}) => {
						if (properties.population) {
							const color = rainbow.colorAt(properties.population);
							console.log(color);
							return {
								color,
							};
						}
						return {
							color: '#000000',
						};
					},
				})
			);
		} catch (e) {
			console.error(e);
			rej(e);
		}
	});
};

let countyHeatmap;

let showCountyHeatmap = false;
document.querySelector('#county-heatmap').onclick = async () => {
	if (!countyHeatmap) {
		countyHeatmap = await genCountyHeatmap();
	}
	showCountyHeatmap = !showCountyHeatmap;
	if (!showCountyHeatmap) {
		map.removeLayer(countyHeatmap);
	} else {
		map.addLayer(countyHeatmap);
	}
};

// DEBUG
map.addLayer(majorCities);
