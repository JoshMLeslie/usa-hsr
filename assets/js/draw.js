"use strict";

import { HIDE_CITY_LABELS, SHOW_CITY_LABELS } from "./const.js";

/*global L:readonly*/

/**
 * @param {L.LatLng} latLng
 * @returns {string}
 */
const latLngToCardinal = latLng => {
	const {lat, lng} = latLng;
	const NS = (lat > 0 ? 'N' : 'S') + lat.toString().replace('-', '');
	const EW = (lng > 0 ? 'E' : 'W') + lng.toString().replace('-', '');
	return [NS, EW];
};

export const drawMarker = (map, coord, name, markerOpts = {}) => {
	const marker = L.circleMarker(coord, {
		radius: 5,
		color: '#333333',
		...markerOpts
	});

	const latLng = L.latLng(coord);

	// Hover tooltip
	const elP = document.createElement('p');
	const [lat, lng] = latLngToCardinal(latLng);
	elP.innerText = `${name}\n${lat}\n${lng}`;
	marker.bindTooltip(elP);

	// toggle tooltip, just name
	const nameTTip = L.tooltip(latLng, {content: name, direction: 'right'});

	document.addEventListener(SHOW_CITY_LABELS, () => {
		nameTTip.openOn(map);
	});
	document.addEventListener(HIDE_CITY_LABELS, () => {
		nameTTip.close();
	});
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

export const drawRoute = (map, route, coords) => {
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

		const [line, padding] = drawPolyline(map, [aCoord, bCoord], opts);
		const markers = [drawMarker(map, aCoord, a.city), drawMarker(map, bCoord, b.city)];

		routeGroup.addLayer(line);
		routeGroup.addLayer(padding);
		routeGroup.addLayer(L.layerGroup(markers));

		routeGroup.on('mouseover', _ => {
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
export const drawZone = (map, zone, coords) => {
	for (const route of zone) {
		drawRoute(map, route, coords).addTo(map);
	}
};
