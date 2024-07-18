'use strict';

import { HIDE_CITY_LABELS, SHOW_CITY_LABELS } from '../const.js';

/*global L:readonly*/

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

/**
 *
 * @param {L.Map} map - optional, for drawing the 'name' tooltip
 * @param {[number, number]} coord
 * @param {string} name
 * @param {any} markerOpts
 * @returns
 */
export const drawMarker = (map, coord, name, markerOpts = {}) => {
	const marker = L.circleMarker(coord, {
		radius: 5,
		color: '#333333',
		...markerOpts,
	});

	const latLng = L.latLng(coord);

	// Hover tooltip
	const elP = document.createElement('p');
	const [lat, lng] = latLngToCardinal(latLng);
	elP.innerText = `${name}\n${lat}\n${lng}`;
	marker.bindTooltip(elP);

	if (map && name) {
		// toggle tooltip, just name
		const nameTTip = L.tooltip(latLng, {content: name, direction: 'right'});
		document.addEventListener(SHOW_CITY_LABELS, () => {
			nameTTip.openOn(map);
		});
		document.addEventListener(HIDE_CITY_LABELS, () => {
			nameTTip.close();
		});
	}
	return marker;
};

export const drawPolyline = (map, coords, opts) => {
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
		.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // pretty print
	const mToMi = 0.0006213712;
	const distMi = (rawDistMeter * mToMi)
		.toFixed(2)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // pretty print

	// tooltip element
	const pre = document.createElement('pre');
	pre.innerText = `Section\n${distKm} km\n${distMi} mi`;
	pre.style.fontSize = '0.8rem';
	polyPadding.bindTooltip(pre, {direction: 'left'});

	return [poly, polyPadding, distKm, distMi];
};

export const drawRoute = (map, route, coords) => {
	const lineGroup = L.featureGroup([]);
	const paddingGroup = L.featureGroup([]);
	const markerGroup = L.featureGroup([]);
	let totalDistKm = 0;
	let totalDistMi = 0;

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

		// TODO - remove or implement
		if (a.weight && b.weight) {
			opts.weight = Math.min(a.weight, b.weight);
		}

		const [line, padding, distKm, distMi] = drawPolyline(
			map,
			[aCoord, bCoord],
			opts
		);

		totalDistKm += +distKm;
		totalDistMi += +distMi;

		// TODO for route wiggling purposes: city.bypass ? ...
		const markers = [
			drawMarker(map, aCoord, a.city),
			drawMarker(map, bCoord, b.city),
		];

		lineGroup.addLayer(line);
		paddingGroup.addLayer(padding);
		markerGroup.addLayer(L.layerGroup(markers));
	}
	const routeGroup = L.featureGroup([lineGroup, paddingGroup, markerGroup]);

	const totalTooltip = document.createElement('pre');
	totalTooltip.innerText = `Corridor\n${totalDistKm} km\n${totalDistMi} mi`;
	totalTooltip.style.fontSize = '0.8rem';
	routeGroup.bindTooltip(totalTooltip, {direction: 'right'});

	routeGroup.on('mouseover', (e) => {
		lineGroup.setStyle({opacity: 1});
		paddingGroup.setStyle({opacity: 0.4});
	});
	routeGroup.on('mouseout', () => {
		lineGroup.setStyle({opacity: 0.5});
		paddingGroup.setStyle({opacity: 0.2});
	});
	console.log(routeGroup);
	return routeGroup;
};

/**
 * @param {Zone} zone
 * @param {COORDS} coords
 * @returns {L.layerGroup} LayerGroup
 */
export const drawZone = (map, zone, coords) => {
	const routes = [];
	for (const route of zone) {
		routes.push(drawRoute(map, route, coords));
	}
	return L.layerGroup(routes);
};

export const drawRegion = () => {};
