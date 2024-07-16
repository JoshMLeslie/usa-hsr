'use strict';
import abbreviatedStateNames from './assets/js/abbreviated-state-names.mjs';
/*global L:readonly*/

import genCountyHeatmap from './assets/js/county-heatmap.js';
import {eHIDE_CITY_LABELS, eSHOW_CITY_LABELS} from './assets/js/events.js';
import init from './assets/js/init.js';
import genMajorCityMarkers from './assets/js/mapping/major-city-markers.js';

const map = await init();

// city labels show/hide
document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

const dataCache = {
	majorCities: null,
	countyHeatmap: null,
};

const toggleMajorCities = async () => {
	const {majorCities} = dataCache;
	if (!dataCache.majorCities) {
		dataCache.majorCities = await genMajorCityMarkers();
	}
	if (map.hasLayer(majorCities)) {
		map.removeLayer(majorCities);
		console.log('remove major cities');
	} else {
		map.addLayer(majorCities);
		console.log('add major cities');
	}
};
document.querySelector('#major-cities').onclick = toggleMajorCities;

let countyHeatmap;
let showCountyHeatmap = false;
const toggleCountyHeatmap = async () => {
	if (!dataCache.countyHeatmap) {
		dataCache.countyHeatmap = await genCountyHeatmap();
	}
	showCountyHeatmap = !showCountyHeatmap;
	showCountyHeatmap
		? map.addLayer(countyHeatmap)
		: map.removeLayer(countyHeatmap);
};
document.querySelector('#county-heatmap').onclick = toggleCountyHeatmap;

let selectedState;
const stateSelector = document.querySelector('#state-route-selector');
const stateSelectorEnter = document.querySelector('#state-route-show');
abbreviatedStateNames.forEach(name => {
	const option = document.createElement('option');
	option.value = name;
	option.textContent = name;
	stateSelector.appendChild(option);
});
stateSelector.addEventListener('change', e => {
	selectedState = e.target.value;
});
stateSelectorEnter.onclick = () => {
	alert('todo: routes for specific states: ' + selectedState);
	// todo SHOW STATE ROUTE
};

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
