'use strict';
/* global L:readonly */

import {bindRegionButtonsToMap} from './bind-btns.js';
import {INIT_ZOOM_LEVEL, ZOOM_LEVEL} from './const.js';
import USA_StateBoundaryData from './geojson/usa-state-bounds.js';
import {getBoundsForBox} from './util.js';
import CENTERS from './zones/centers.js';

const initMaps = () => {
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
		keyboard: false,
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

/** open LatLng popup on rightclick. +shift => center of map / view */
const configRightClick = map => {
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
};

/** add Earth images from OSM */
const addOSMTiles = (map, mapHUD) => {
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
};

/** @returns {L.Map} map */
export default async function () {
	const [map, mapHUD] = initMaps();
	initHelpDialog();
	await initSoftRegions(map);
	initMapHUDViewbox(map, mapHUD);
	configRightClick(map);
	addOSMTiles(map, mapHUD);
	return map;
}
