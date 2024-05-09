import COORDS from './coords.js';
import CENTERS from './zones/centers.js';
import ZONE_CENTRAL from './zones/central.js';
import ZONE_G_LAKES from './zones/great-lakes.js';
import ZONE_NE from './zones/north-east.js';
import ZONE_SE from './zones/south-east.js';
import ZONE_WEST from './zones/west.js';

const ZOOM_LEVEL = {
	continent: 3,
	country: 4,
	region: 5,
	tristate: 6,
};

const isProd = false;
const INIT_ZOOM_LEVEL = ZOOM_LEVEL.tristate;

/**
 * @param {L.LatLng} latLng
 * @returns {string}
 */
const latLngToCardinal = (latLng) => {
	const {lat, lng} = latLng;
	const NS = (lat > 0 ? 'N' : 'S') + lat.toString().replace('-', '');
	const EW = (lng > 0 ? 'E' : 'W') + lng.toString().replace('-', '');
	return [NS, EW];
};

// INIT START
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

// START Interactive mapHUD viewbox
const getBoundsForBox = () => {
	const NW = map.getBounds().getNorthWest();
	return [
		NW,
		map.getBounds().getNorthEast(),
		map.getBounds().getSouthEast(),
		map.getBounds().getSouthWest(),
		NW,
	];
};

const viewBox = L.rectangle(getBoundsForBox(), {
	interactive: true,
	draggable: true,
	zoomable: true,
	asDelta: false,
	zoom: INIT_ZOOM_LEVEL,
});
viewBox.addTo(mapHUD);
viewBox.on('dragend', (v) => {
	const draggedTo = v.target.getCenter();
	map.setView(draggedTo);
});
viewBox.on('zoom', (v) => {
	map.setZoom(v.zoom);
});

const drawViewBox = () => viewBox.setLatLngs(getBoundsForBox());

map.on('moveend', drawViewBox);
map.on('zoomend', drawViewBox);
// END Interactive mapHUD viewbox

// open LatLng popup on rightclick. +shift => center of map / view
map.on('contextmenu', (e) => {
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

// Captures the various train routes into a leaflet object for ref
const RouteGroupings = new L.LayerGroup();

// events
const SHOW_CITY_LABELS = 'show_city_labels';
const eSHOW_CITY_LABELS = new Event(SHOW_CITY_LABELS);
const HIDE_CITY_LABELS = 'hide_city_labels';
const eHIDE_CITY_LABELS = new Event(HIDE_CITY_LABELS);
// INIT END

const drawMarkers = (coords, names) => {
	return coords.map((coord, i) => {
		const marker = L.circleMarker(coord, {
			radius: 5,
			color: '#333333',
		});

		const latLng = L.latLng(coord);

		// Hover tooltip
		const elP = document.createElement('p');
		const cardinalLatLng = latLngToCardinal(latLng);
		elP.innerText = `${names[i]}\n${cardinalLatLng[0]}\n${cardinalLatLng[1]}`;
		marker.bindTooltip(elP);

		// toggle tooltip, just name
		const nameTTip = L.tooltip(latLng, {content: names[i], direction: 'right'});

		document.addEventListener(SHOW_CITY_LABELS, () => {
			nameTTip.openOn(map);
		});
		document.addEventListener(HIDE_CITY_LABELS, () => {
			nameTTip.close();
		});
		return marker;
	});
};

const drawPolyline = (coords, opts) => {
	if (coords.length < 2) return;

	const poly = L.polyline(coords, {opacity: 0.5, ...opts});
	const polyPadding = L.polyline(coords, {
		...opts,
		opacity: 0.2,
		weight: 10,
	});

	const rawDistMeter = map.distance(...coords);
	const distKm = (rawDistMeter / 1000)
		.toFixed(2)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	const mToMi = 0.0006213712;
	const distMi = (rawDistMeter * mToMi)
		.toFixed(2)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	// tooltip element
	const pre = document.createElement('pre');
	pre.innerText = `${distKm} km\n${distMi} mi`;
	pre.style.fontSize = '0.8rem';
	polyPadding.bindTooltip(pre);

	return [poly, polyPadding];
};

const drawRoute = (route, coords) => {
	const routeGroup = L.featureGroup([]);

	for (let aIdx = 0, bIdx = 1; bIdx < route.length; aIdx++, bIdx++) {
		const a = route[aIdx];
		const b = route[bIdx];

		const aCoord = coords[a.country][a.state][a.city];
		const bCoord = coords[b.country][b.state][b.city];

		if (!aCoord || !bCoord) {
			if (!aCoord) {
				console.warn('Coordinate missing', a);
			}
			if (!bCoord) {
				console.warn('Coordinate missing', b);
			}
			throw new ReferenceError('Coordinate missing');
		}

		const isInterNational = a.country !== b.country;
		const isInterState = a.state !== b.state;

		let opts = {color: 'blue'};
		if (isInterNational) {
			opts = {
				color: 'orange',
				dashArray: 16,
			};
		} else if (isInterState) {
			opts = {
				color: 'green',
				dashArray: 4,
			};
		}

		if (a.weight && b.weight) {
			opts.weight = Math.min(a.weight, b.weight);
		}

		const [line, padding] = drawPolyline([aCoord, bCoord], opts);
		const markers = drawMarkers([aCoord, bCoord], [a.city, b.city]);

		routeGroup.addLayer(line);
		routeGroup.addLayer(padding);
		routeGroup.addLayer(L.layerGroup(markers));

		routeGroup.on('mouseover', (e) => {
			line.setStyle({opacity: 1});
			padding.setStyle({opacity: 0.4});
		});
		routeGroup.on('mouseout', () => {
			line.setStyle({opacity: 0.5});
			padding.setStyle({opacity: 0.2});
		});
	}

	return routeGroup;
};

/**
 * @param {Zone} zone
 * @param {COORDS} coords
 */
const drawZone = (zone, coords) => {
	for (const route of zone) {
		drawRoute(route, coords).addTo(map);
	}
};

/**
 * @param {string} elID - raw id, no '#' etc. e.g. `<div id="west"></div>` => 'west'
 * @param {keyof CENTERS} center
 * @param {{zone: Zone, zoom: number}}
 */
const bindRegionBtn = (elID, center, {zone, zoom = ZOOM_LEVEL.country} = {}) => {
	if (!elID || !center) {
		throw ReferenceError('missing required argument(s)');
	}

	try {
		document.querySelector('.region-btn#' + elID).onclick = () => {
			map.setView(CENTERS[center], zoom);
			if (zone) {
				drawZone(zone, COORDS);
			}
		};
	} catch (e) {
		console.error('Error while binding region button', e);
	}
};

// btn binding
bindRegionBtn('namr', 'NA', {zoom: ZOOM_LEVEL.continent});
bindRegionBtn('usa', 'USA');
bindRegionBtn('canada', 'CANADA');
bindRegionBtn('mexico', 'MEXICO');
bindRegionBtn('west', 'NA_WEST', {zone: ZONE_WEST, zoom: ZOOM_LEVEL.region});
bindRegionBtn('central', 'NA_CENTRAL', {zone: ZONE_CENTRAL, zoom: ZOOM_LEVEL.region});
bindRegionBtn('great-lakes', 'NA_G_LAKES', {zone: ZONE_G_LAKES, zoom: ZOOM_LEVEL.region});
bindRegionBtn('north-east', 'NA_NE', {zone: ZONE_NE, zoom: ZOOM_LEVEL.tristate});
bindRegionBtn('south-east', 'NA_SE', {zone: ZONE_SE, zoom: ZOOM_LEVEL.tristate});

// city labels show/hide
document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

// INIT UI
map.setView(CENTERS.NA_NE, 6);
drawZone(ZONE_NE, COORDS);
