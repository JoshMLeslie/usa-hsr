'use strict';
/* global L:readonly */

import {bindRegionButtonsToMap} from './bind-btns.js';
import {INIT_ZOOM_LEVEL, ZOOM_LEVEL, PROD_CENTER} from './const.js';
import USA_StateBoundaryData from './geojson/usa-state-bounds.js';
import {getBoundsForBox} from './util.js';
import CENTERS from './zones/centers.js';

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

const initHelpDialog = () => {
	const helpDialog = document.querySelector('dialog#help-dialog');
	document.addEventListener('keydown', ({key}) => {
		if (key === '?') {
			helpDialog.showModal();
		}
	});
	document.querySelector('#help-dialog-open').addEventListener('click', () => {
		helpDialog.showModal();
	});
	helpDialog.addEventListener('click', ({ctrlKey}) => {
		if (ctrlKey) {
			helpDialog.close();
		}
	});
	document.querySelector('#help-dialog-close').addEventListener('click', () => {
		helpDialog.close();
	});
};

const initSoftRegions = async map => {
	// generate soft regions
	const softRegions = {};
	await fetch('./assets/js/zones/soft-regions.json')
		.then(r => r.json())
		.then(d => {
			// todo figure out why L.geoJson(d) won't render
			d.features.forEach(f => {
				if (!f.geometry.coordinates[0].length) return;
				const poly = L.polygon(f.geometry.coordinates[0], {
					interactive: false,
				});
				softRegions[f.properties.region] = poly;
			});
			console.log('generated soft regions: ', d.features.length);
		});

	L.geoJson(USA_StateBoundaryData, {
		style: () => ({opacity: 0.5, weight: 2, fill: false}),
	}).addTo(map);

	bindRegionButtonsToMap(map, softRegions);
};

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
};

let distancePointers = [];
let lastMeasurementLine = null;
const cleanupMeasurement = () => {
	if (lastMeasurementLine) {
		lastMeasurementLine.remove();
		lastMeasurementLine = null;
	}
	if (distancePointers) {
		distancePointers.forEach(dp => dp.remove());
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
		if (map.getZoom() < 7) {
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
/** open LatLng popup on rightclick. +shift => center of map / view */
const configContextMenu = map => {
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
	mapTile.setOpacity(0.3);
	mapTile.addTo(map);
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 10,
		attribution:
			'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
	}).addTo(mapHUD);
};

const loadWikimedia = async map => {
	console.log('loading wikimedia');
	const {data: lehighValley} = await fetch(
		'./assets/js/geojson/wikimedia_lehigh-valley.json'
	).then(r => r.json());
	const {data: centralNJ} = await fetch(
		'./assets/js/geojson/wikimedia_central-railroad-of-new-jersey.json'
	).then(r => r.json());
	console.log(lehighValley, centralNJ);
	map.addLayer(
		L.featureGroup([
			L.geoJson(lehighValley, {
				style: () => ({opacity: 0.5, weight: 4, color: '#ffa500'}),
			}),
			L.geoJson(centralNJ, {
				style: () => ({opacity: 0.5, weight: 4}),
			}),
		])
	);
};

/** @returns {L.Map} map */
export default async function () {
	const [map, mapHUD] = initMaps();
	initHelpDialog();
	await initSoftRegions(map);
	initMapHUDViewbox(map, mapHUD);
	configContextMenu(map);
	addOSMTiles(map, mapHUD);
	loadWikimedia(map);
	return map;
}
