import pingMarker from "../mapping/ping-marker.js";

export default function initPingCoord (map) {
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
}
