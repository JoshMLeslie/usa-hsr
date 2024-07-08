'use strict';

import { drawMarker } from "./draw.js";
import { extractCoordFrom } from "./extract-coord.js";

/**
 * @param {L.Map} map
 * @param {string} rawCoord
 * @param isJSON - tells the function to expect json instead of a string input
 * @returns {boolean} marker on success
 */
export default function pingMarker (map, rawCoord, opts = {isJSON: false, flyTo: true}) {
	if (!rawCoord) return;
	const latLng = opts.isJSON
		? {lat: rawCoord.lat, lng: rawCoord.lng}
		: extractCoordFrom(rawCoord);
	if (!latLng) {
		alert('bad input');
		return;
	}
	const m = drawMarker(null, latLng, 'PING');
	map.addLayer(m);
	if (opts.flyTo) {
		map.flyTo(latLng);
	}
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
	return m;
};