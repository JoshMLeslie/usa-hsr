'use strict';
/*global L:readonly*/

import init from './assets/js/init.js';

const [map, mapHUD] = await init();

const resizeDiv = document.querySelector('#resize-divider');
const mapCont = document.querySelector('#map-container');
const hudMapCont = document.querySelector('#hud-map-container');
const doc = document;

resizeDiv.ondrag = ({offsetX}) => {
	// defend against last drag event having an errant offset
	if (Math.abs(offsetX) > 50) return;
	// defend against compressing the divs too small
	// using js because @container wasn't behaving as expected
	if (
		(hudMapCont.clientWidth < 200 && offsetX > 0) ||
		(mapCont.clientWidth < 200 && offsetX < 0)
	)
		return;

	const max = document.body.clientWidth;
	const maxDiff = max - mapCont.clientWidth - hudMapCont.clientWidth;
	const halfMaxDiff = maxDiff / 2;
	mapCont.style.width = mapCont.clientWidth + halfMaxDiff + offsetX + 'px';
	hudMapCont.style.width =
		hudMapCont.clientWidth + halfMaxDiff - offsetX + 'px';
};
resizeDiv.ondragend = () => {
	setTimeout(() => {
		map.invalidateSize();
		mapHUD.invalidateSize();
	});
};
