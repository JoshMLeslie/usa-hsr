import {default as COORDS} from './coords.json' with { type: 'json' };
import CENTERS from './zones/centers.js';
import INTER_NE from './zones/inter-ne.js';
import NE_ZONE from './zones/north-east.js';
import WEST_ZONE from './zones/west.js';

// INIT
// var map = L.map('map').setView(CENTERS.USA, 4);
var map = L.map('map').setView(CENTERS.USA_NE, 6);

// Captures the various routes into a leaflet object for ref
const RouteGroupings = new L.LayerGroup();

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 10,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
}).addTo(map);

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
		marker.bindTooltip(names[i]);
		document.addEventListener(SHOW_CITY_LABELS, () => {
			marker.openTooltip();
		});
		document.addEventListener(HIDE_CITY_LABELS, () => {
			marker.closeTooltip();
		});
		marker.on('mouseover', () => {
			// interaction, in front of nearby tooltips
			marker.bringToFront();
		});
		marker.on('click', () => {
			console.log('clicked');
		});
		// initial draw, in front of lines
		marker.bringToFront();
		return marker;
	});
};

const drawPolyline = (coords, routeGroup, opts) => {
	if (coords.length > 1) {
		const poly = L.polyline(coords, {opacity: 0.5, ...opts});
		const polyPadding = L.polyline(coords, {
			...opts,
			opacity: 0.25,
			weight: 10,
		});
		routeGroup.addLayer(poly);
		routeGroup.addLayer(polyPadding);
		poly.bindTooltip('foo');

		routeGroup.on('mouseover', () => {
			poly.setStyle({opacity: 1});
			polyPadding.setStyle({opacity: 0.5});
		});
		routeGroup.on('mouseout', () => {
			poly.setStyle({opacity: 0.5});
			polyPadding.setStyle({opacity: 0.25});
		});
	}
};

const draw = ({coords, routeGroup, opts, names = ''}) => {
	const markers = drawMarkers(coords, names);

	routeGroup.addLayer(L.layerGroup(markers));

	drawPolyline(coords, routeGroup, opts);

	RouteGroupings.addLayer(routeGroup);
};

const drawZone = (zone, coords) => {
	for (const route of zone) {
		const routeGroup = L.featureGroup([], {interactive: true});

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

			draw({
				coords: [aCoord, bCoord],
				opts,
				names: [a.city, b.city],
				routeGroup,
			});
		}
		routeGroup.addTo(map);
	}
};

// btn binding
document.querySelector('#usa-region-btn').onclick = () => {
	map.setView(CENTERS.USA, 4);
};
document.querySelector('#north-east-region-btn').onclick = () => {
	map.setView(CENTERS.USA_NE, 6);
	drawZone(NE_ZONE, COORDS);
};
document.querySelector('#west-region-btn').onclick = () => {
	map.setView(CENTERS.USA_WEST, 4);
	drawZone(WEST_ZONE, COORDS);
};

document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

// startup UI
map.setView(CENTERS.USA_NE, 6);
drawZone(NE_ZONE, COORDS);
drawZone(INTER_NE, COORDS);
