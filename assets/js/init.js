'use strict';
/* global L:readonly */

import { bindRegionButtonsToMap, setupBoundaryButtons } from './bind-btns.js';
import { INIT_ZOOM_LEVEL, PROD_CENTER, ZOOM_LEVEL } from './const/const.js';
import abbreviatedStateNames from './const/usa-states/abbreviated-state-names.mjs';
import genCountyHeatmap from './county-heatmap.js';
import { eHIDE_CITY_LABELS, eSHOW_CITY_LABELS } from './events.js';
import initAddressLookup from './interactions/address-lookup.js';
import initPingCoord from './interactions/ping-coord.js';
import genMajorCityMarkers from './mapping/major-city-markers.js';
import { fetchJSON, getBoundsForBox } from './util.js';
import CENTERS from './zones/centers.js';

const simpleDataCache = {
	majorCities: null,
	countyHeatmap: null,
};

/**
 * @returns [L.Map, L.Map] - base map and HUD map
 */
const initMaps = () => {
	const isProd = !/localhost|127.0.0.1/.test(location.href);
	document.querySelector('body').classList.add(isProd ? 'prod' : 'dev');

	let map;
	if (isProd) {
		map = L.map('map', {
			center: PROD_CENTER,
			zoom: INIT_ZOOM_LEVEL,
			wasdKeyboard: true,
		});
	} else {
		map = L.map('map', {
			center: CENTERS.NA,
			zoom: ZOOM_LEVEL.country,
			wasdKeyboard: true,
		});
	}

	// 	let lastZoom = INIT_ZOOM_LEVEL;
	// 	map.on('zoomend', (e) => {
	// 		// TODO route specificity relative to zoom level alike ClusterMarkers
	// 		const newZoom = e.target.getZoom()
	// 		const zoomDiff = newZoom - lastZoom;
	// 		console.log(e, lastZoom, newZoom, zoomDiff)
	// })

	const mapHUD = L.map('hud-map', {
		keyboard: false,
		center: PROD_CENTER,
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

	return [map, mapHUD];
};

const initSupportDialog = () => {
	const helpDialog = document.querySelector('dialog#support-dialog');
	document.addEventListener('keydown', ({key}) => {
		if (key === '?') {
			helpDialog.showModal();
		}
	});
	document
		.querySelector('#support-dialog-open')
		.addEventListener('click', () => {
			helpDialog.showModal();
		});
	helpDialog.addEventListener('click', ({ctrlKey}) => {
		if (ctrlKey) {
			helpDialog.close();
		}
	});
	document
		.querySelector('#support-dialog-close')
		.addEventListener('click', () => {
			helpDialog.close();
		});
	// support dialog tab actions
	const supportDialogActions = document.querySelector(
		'#support-dialog_header_actions'
	);
	const supportDialogContent = document.querySelectorAll(
		'.support-dialog-content'
	);
	for (const action of supportDialogActions.children) {
		const tab = action.getAttribute('data-tab');
		action.onclick = () => {
			for (const action of supportDialogActions.children) {
				action.classList.remove('active');
			}
			action.classList.add('active');
			for (const content of supportDialogContent) {
				if (content.getAttribute('data-for-tab') === tab) {
					content.classList.remove('hidden');
				} else {
					content.classList.add('hidden');
				}
			}
		};
	}
};

const initSoftRegions = async (map) => {
	// generate soft regions
	const softRegions = {};
	const data = await fetchJSON('./assets/js/zones/soft-regions.json');
	// todo figure out why L.geoJson(d) won't render
	data.features.forEach((f) => {
		if (!f.geometry.coordinates[0].length) return;
		const poly = L.polygon(f.geometry.coordinates[0], {
			interactive: false,
		});
		softRegions[f.properties.region] = poly;
	});
	console.log('generated soft regions: ', data.features.length);
	bindRegionButtonsToMap(map, softRegions);
};

/** data from https://gadm.org/download_country.html */
const loadGeojsonBounds = (country) => async (useLayer) => {
	const path =
		`/assets/js/geojson/${country}-state-bounds_${useLayer}.json`;
	return fetch(path)
		.then((r) => r.json())
		.then((d) =>
			L.geoJson(d, {
				style: () => ({opacity: 0.5, weight: 2, fill: false}),
			})
		)
		.catch((e) => console.warn(e));
};
function initBoundaryButtons(map) {
	setupBoundaryButtons(map, {
		getCanada: loadGeojsonBounds('canada'),
		getUSA: loadGeojsonBounds('usa'),
		getMexico: loadGeojsonBounds('mexico'),
	});
}

const initMapHUDViewbox = (map, mapHUD) => {
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

	viewBox.on('dragend', (v) => {
		const draggedTo = v.target.getCenter();
		map.setView(draggedTo);
	});
	viewBox.on('zoom', (v) => {
		map.setZoom(v.zoom);
	});

	const drawViewBox = () => {
		const mapBounds = getBoundsForBox(map);
		viewBox.setLatLngs(mapBounds);
		viewBoxBackground.setLatLngs([getBoundsForBox(mapHUD), mapBounds]);
	};

	map.on('moveend', drawViewBox);
	map.on('zoomend', drawViewBox);
};

let distancePointers = [];
let lastMeasurementLine = null;
const cleanupMeasurement = () => {
	if (lastMeasurementLine) {
		lastMeasurementLine.remove();
		lastMeasurementLine = null;
	}
	if (distancePointers) {
		distancePointers.forEach((dp) => dp.remove());
		distancePointers = [];
	}
};
const measurePointToPoint = (map, useLatLng) => {
	let content;
	if (distancePointers.length === 2) {
		cleanupMeasurement();
	}
	distancePointers.push(L.circleMarker(useLatLng, {radius: 10}).addTo(map));

	if (distancePointers.length === 2) {
		let distance = useLatLng.distanceTo(distancePointers[0].getLatLng());
		let unit = 'meters';
		if (distance >= 10000) {
			distance /= 1000;
			unit = 'km';
		}
		content = `Distance: ${distance.toFixed(2)} ${unit}`;
		lastMeasurementLine = L.polyline(
			[distancePointers[0].getLatLng(), useLatLng],
			{color: 'red'}
		).addTo(map);
	} else {
		content = 'Select second point';
	}
	return content;
};
/** open LatLng popup on rightclick.
 * +shift => center of map / view
 * +alt => measure
 * +ctrl => copy latlng to clipboard
 */
const configContextMenu = (map) => {
	map.on('click', () => {
		cleanupMeasurement();
	});
	map.on('contextmenu', ({latlng, originalEvent}) => {
		originalEvent.preventDefault();
		let useLatLng = latlng;
		/** @type {string} */
		let content;

		if (originalEvent.shiftKey) {
			useLatLng = map.getCenter();
		}

		if (originalEvent.altKey) {
			content = measurePointToPoint(map, useLatLng);
		} else {
			content = `${useLatLng.lat.toFixed(4)}, ${useLatLng.lng.toFixed(4)}`;
		}

		// copy to clipboard handling
		if (originalEvent.ctrlKey && originalEvent.altKey) {
			// copy raw distance value
			navigator.clipboard.writeText(`${content.match(/\d+.\d+/)[0]}`);
		} else if (originalEvent.ctrlKey) {
			// copy latlng to clipboard as '[lat, lng]'
			navigator.clipboard.writeText(`[${content}],`);
		}
		if (content) {
			L.popup({content}).setLatLng(useLatLng).openOn(map);
		}
	});
};

/** add Earth images from OSM */
const addOSMTiles = (map, mapHUD) => {
	const mapTile = L.tileLayer(
		'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
		{
			maxZoom: 10,
			attribution:
				'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
		}
	);
	mapTile.on('loaderror', console.warn);
	mapTile.addTo(map);
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 10,
		attribution:
			'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
	}).addTo(mapHUD);
};

function bindCityLabelEvents() {
	// city labels show/hide
	document.querySelector('#show-city-labels').onclick = () => {
		document.dispatchEvent(eSHOW_CITY_LABELS);
	};
	document.querySelector('#hide-city-labels').onclick = () => {
		document.dispatchEvent(eHIDE_CITY_LABELS);
	};
}

function initMajorCities(map) {
	const toggleMajorCities = async (map) => {
		const {majorCities} = simpleDataCache;
		if (!simpleDataCache.majorCities) {
			simpleDataCache.majorCities = await genMajorCityMarkers();
		}
		if (map.hasLayer(majorCities)) {
			map.removeLayer(majorCities);
			console.log('remove major cities');
		} else {
			map.addLayer(majorCities);
			console.log('add major cities');
		}
	};
	document.querySelector('#highest-pop-cities').onclick = toggleMajorCities;
}

function initCountyHeatmap() {
	let countyHeatmap;
	let showCountyHeatmap = false;
	const toggleCountyHeatmap = async (map) => {
		if (!simpleDataCache.countyHeatmap) {
			simpleDataCache.countyHeatmap = await genCountyHeatmap();
		}
		showCountyHeatmap = !showCountyHeatmap;
		showCountyHeatmap
			? map.addLayer(countyHeatmap)
			: map.removeLayer(countyHeatmap);
	};
	document.querySelector('#county-heatmap').onclick = toggleCountyHeatmap;
}

/**
 * @param {string[]} states
 */
function setStateSelector(states) {
	const stateSelector = document.querySelector('#state-route-selector');
	stateSelector.innerHTML = '';

	states.forEach((name) => {
		const option = document.createElement('option');
		option.value = name;
		option.textContent = name;
		stateSelector.appendChild(option);
	});
}
function initStateRoutes() {
	const stateSelector = document.querySelector('#state-route-selector');
	const countrySelector = document.querySelector('#country-route-selector');
	const stateSelectorEnter = document.querySelector('#state-route-show');

	// init values / html
	let selectedState = 'PA';
	let selectedCountry = 'USA';
	setStateSelector(abbreviatedStateNames);
	stateSelector.value = selectedState;

	countrySelector.addEventListener('change', (e) => {
		selectedCountry = e.target.value;
		switch (selectedCountry) {
			case 'USA':
				setStateSelector(abbreviatedStateNames);
				break;
		}
	});
	stateSelector.addEventListener('change', (e) => {
		selectedState = e.target.value;
	});
	stateSelectorEnter.onclick = () => {
		alert(
			'todo: routes for specific states: ' +
				selectedCountry +
				',' +
				selectedState
		);
		// todo SHOW STATE ROUTE
	};
}

function initServiceWorker() {
	window.addEventListener('load', () => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/assets/js/service-worker/service-worker.js')
				.then((registration) => {
					console.log(
						'Service Worker registered with scope:',
						registration.scope
					);
				})
				.catch((error) => {
					console.error('Service Worker registration failed:', error);
				});
		} else {
			console.warn('Service Workers are not supported in this browser.');
		}
	});
}

function bindHomeIcon() {
	document.querySelector('#home-icon').onclick = () => {
		window.location.href = '/';
	};
}

/** @returns {L.Map} map */
export default async function () {
	const [map, mapHUD] = initMaps();
	await initSoftRegions(map);
	initMapHUDViewbox(map, mapHUD);
	configContextMenu(map);
	addOSMTiles(map, mapHUD);

	// Support
	bindCityLabelEvents();
	initPingCoord(map);
	initAddressLookup(map);
	initMajorCities(map);
	initCountyHeatmap();
	initStateRoutes();
	initSupportDialog();
	bindHomeIcon();
	initBoundaryButtons(map);

	// todo - caching
	// initServiceWorker();

	return [map, mapHUD];
}
