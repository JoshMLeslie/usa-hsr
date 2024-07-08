'use strict';
/*global L:readonly*/

import genCountyHeatmap from './assets/js/county-heatmap.js';
import {eHIDE_CITY_LABELS, eSHOW_CITY_LABELS} from './assets/js/events.js';
import init from './assets/js/init.js';
import genMajorCityMarkers from './assets/js/mapping/major-city-markers.js';
import NominatimJS from './assets/js/mapping/nominatim.js';
import pingMarker from './assets/js/mapping/ping-marker.js';

const map = await init();

// city labels show/hide
document.querySelector('#show-city-labels').onclick = () => {
	document.dispatchEvent(eSHOW_CITY_LABELS);
};
document.querySelector('#hide-city-labels').onclick = () => {
	document.dispatchEvent(eHIDE_CITY_LABELS);
};

const dataCache = {
	majorCities: await genMajorCityMarkers(map),
};

const toggleMajorCities = () => {
	const {majorCities} = dataCache;
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
	if (!countyHeatmap) {
		countyHeatmap = await genCountyHeatmap();
	}
	showCountyHeatmap = !showCountyHeatmap;
	showCountyHeatmap
		? map.addLayer(countyHeatmap)
		: map.removeLayer(countyHeatmap);
};
document.querySelector('#county-heatmap').onclick = toggleCountyHeatmap;

const pingInput = document.querySelector('#ping-coord');
pingInput.addEventListener('keydown', e => {
	if (e.code === 'Enter') {
		const clearVal = pingMarker(map, e.target.value);
		if (clearVal) {
			e.target.value = '';
		}
	}
});
document.querySelector('#ping-coord-enter').onclick = () => {
	const clearVal = pingMarker(map, pingInput.value);
	if (clearVal) {
		pingInput.value = '';
	}
};
document.querySelector('#ping-coord-clear').onclick = () => {
	pingInput.value = '';
};

let nominatim;
const nominatimMarker = async (search, results) => {
	if (!search && !results) return;
	let clearVal;
	console.log(results);
	try {
		results ||= await nominatim.search({q: search});
		if (results) {
			clearVal = true;
		}
		if (results.length) {
			const markers = results.map(r =>
				pingMarker(map, r, {isJSON: true, flyTo: false})
			);
			const bounds = L.featureGroup(markers).getBounds().pad(0.5);
			map.fitBounds(bounds);
		} else {
			alert('no results');
			return;
		}
	} catch (e) {
		console.warn(e);
		alert(e);
	}
	return clearVal;
};

const locationInput = document.querySelector('#lookup-location');
locationInput.addEventListener('keydown', async e => {
	if (!nominatim) {
		nominatim = new NominatimJS();
	}
	if (e.code === 'Enter') {
		if (await nominatimMarker(e.target.value)) {
			e.target.value = '';
		}
	}
});
document.querySelector('#lookup-location-enter').onclick = async () => {
	if (await nominatimMarker(locationInput.value)) {
		locationInput.value = '';
	}
};
document.querySelector('#lookup-location-clear').onclick = () => {
	locationInput.value = '';
};
const popupContainer = document.querySelector('#popup-container');
document.querySelector('#lookup-location-advanced').onclick = async () => {
	try {
		const query = locationInput.value;
		locationInput.value = 'Loading';
		const results = await nominatim.search({q: query});
		if (results) {
			popupContainer.classList.toggle('hidden');
			locationInput.value = 'Select an option';
			const list = document.createElement('ul');
			list.id = 'lookup-location-advanced-popup';
			results.forEach(r => {
				const li = document.createElement('li');
				const btn = document.createElement('button');
				btn.textContent = r.display_name;
				btn.onclick = () => {
					console.log(r);
					nominatimMarker(null, [r]);
					locationInput.value = '';
					popupContainer.innerHTML = '';
					popupContainer.classList.toggle('hidden');
				};
				li.appendChild(btn);
				list.appendChild(li);
			});
			popupContainer.appendChild(list);
		}
	} catch (e) {
		console.warn(e);
		alert(e);
	}
};
