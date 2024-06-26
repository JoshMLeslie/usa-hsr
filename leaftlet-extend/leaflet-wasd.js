'use strict';
/* global L:readonly */
const Map = L.Map;
const Handler = L.Handler;
const {on, off, stop} = L.DomEvent;
const toPoint = L.point;

/** Adapted from Leaflet source https://github.com/Leaflet/Leaflet/blob/main/src/map/handler/Map.Keyboard.js */

/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

// @namespace Map
// @section Keyboard Navigation Options
Map.mergeOptions({
	// @option keyboard: Boolean = true
	// Makes the map focusable and allows users to navigate the map with keyboard
	// arrows and `+`/`-` keys.
	keyboard: true,

	// @option keyboardPanDelta: Number = 80
	// Amount of pixels to pan when pressing an arrow key.
	keyboardPanDelta: 80
});

export const WASDKeyboard = Handler.extend({

	keyCodes: {
		left:    ['KeyA'],
		right:   ['KeyD'],
		down:    ['KeyS'],
		up:      ['KeyW'],
	},

	initialize(map) {
		this._map = map;

		this._setPanDelta(map.options.keyboardPanDelta);
	},

	addHooks() {
		const container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex <= 0) {
			container.tabIndex = '0';
		}

		on(container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown
		}, this);

		this._map.on({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	},

	removeHooks() {
		this._removeHooks();

		off(this._map._container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown
		}, this);

		this._map.off({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	},

	//  acquire/lose focus #594, #1228, #1540
	_onPointerDown() {
		if (this._focused) { return; }

		const body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus() {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur() {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanDelta(panDelta) {
		const keys = this._panKeys = {},
		    codes = this.keyCodes;
		let i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * panDelta, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [panDelta, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, panDelta];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * panDelta];
		}
	},

	_addHooks() {
		on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks() {
		off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown(e) {
		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

		const key = e.code,
		     map = this._map;
		let offset;

		if (key in this._panKeys) {
			if (!map._panAnim || !map._panAnim._inProgress) {
				offset = this._panKeys[key];
				if (e.shiftKey) {
					offset = toPoint(offset).multiplyBy(3);
				}

				if (map.options.maxBounds) {
					offset = map._limitOffset(toPoint(offset), map.options.maxBounds);
				}

				if (map.options.worldCopyJump) {
					const newLatLng = map.wrapLatLng(map.unproject(map.project(map.getCenter()).add(offset)));
					map.panTo(newLatLng);
				} else {
					map.panBy(offset);
				}
			}
		} else {
			return;
		}

		stop(e);
	}
});

// @section Handlers
// @section Handlers
// @property keyboard: Handler
// Keyboard navigation handler.
Map.addInitHook('addHandler', 'wasdKeyboard', WASDKeyboard);