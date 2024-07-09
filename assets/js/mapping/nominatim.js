'use strict';

import { fetchJSON } from "../util";

// adapted from https://www.npmjs.com/package/nominatim-js

/**
 * @typedef {Object} HeaderParams
 * @property {'html' | 'json' | 'xml' | 'jsonv2'} [format]
 * @property {string} [json_callback]
 * @property {string} [accept_language]
 * @property {string} ['accept-language']
 * @property {0 | 1} [addressdetails]
 * @property {0 | 1} [extratags]
 * @property {0 | 1} [namedetails]
 * @property {string} [email]
 * @property {0 | 1} [debug]
 * @property {string} [endpoint] - custom open street map endpoint
 */

/**
 * @typedef {Object} NominatimSearchParams
 * @property {string} q - plaintext query, e.g. 'bagel shop in new york'
 * @property {string} [street]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [country]
 * @property {string} [viewbox]
 * @property {string} [postalcode]
 * @property {string[]} [countryCodesArray]
 * @property {string} [countrycodes]
 * @property {0 | 1} [bounded]
 * @property {0 | 1} [polygon]
 * @property {string} [email]
 * @property {string} [exclude_place_ids]
 * @property {number} [limit]
 * @property {0 | 1} [dedupe]
 * @extends {HeaderParams}
 */

/**
 * @typedef {Object} NominatimAddress
 * @property {string} [house_number]
 * @property {string} [road]
 * @property {string} [neighbourhood]
 * @property {string} [suburb]
 * @property {string} [postcode]
 * @property {string} city
 * @property {string} [city_district]
 * @property {string} [county]
 * @property {string} state
 * @property {string} country
 * @property {string} country_code
 * @property {string} [continent]
 * @property {string} [public_building]
 * @property {string} [attraction]
 * @property {string} [pedestrian]
 * @property {string} [peak]
 * @property {string} [bakery]
 * @property {string} [electronics]
 * @property {string} [construction]
 */

/**
 * @typedef {Object} NominatimResult
 * @property {string} place_id
 * @property {string} osm_id
 * @property {PlaceTypeLabel} osm_type
 * @property {string[]} [boundingbox]
 * @property {string} lat
 * @property {string} lng
 * @property {string} display_name
 * @property {string} class
 * @property {string} type
 * @property {number} importance
 * @property {string} icon
 * @property {NominatimAddress} address
 * @property {string} licence
 * @property {string} [svg]
 */

const PLACES_TYPES = {
	node: 'N',
	way: 'W',
	relation: 'R',
};

/**
 * @typedef {keyof typeof PLACES_TYPES} PlaceTypeLabel
 * @typedef {typeof PLACES_TYPES[PlaceTypeLabel]} PlaceTypeId
 */

/**
 * @typedef {Object} OSMId
 * @property {PlaceTypeLabel} type
 * @property {number} id
 */

export default class NominatimJS {
	NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';

	/** @param {string} [endpoint] */
	constructor(endpoint) {
		if (endpoint) {
			this.NOMINATIM_ENDPOINT = endpoint;
		}
	}

	/**
	 * @param {params} HeaderParams
	 * @returns {HeaderParams}
	 */
	normalizeParams(params) {
		return {
			...params,
			format: params.format || 'json',
			'accept-language': params['accept-language'] || params.accept_language,
		};
	}

	/**
	 * @param {OSMId} osmId
	 * @returns {string}
	 */
	stringifyOsmId({type, id}) {
		return `${PLACES_TYPES[type]}${id}`;
	}

	/**
	 * Searches based on the given information. By default searches
	 * against the Open Street Map Nominatim server. A custom endpoint
	 * could be defined, using the "endpoint" parameter.
	 * @param {NominatimSearchParams} rawParams
	 * @returns {Promise<NominatimResult[]>}
	 */
	async search(rawParams) {
		const params = this.normalizeParams(rawParams);
		const countryCodes =
			params.countrycodes || params?.countryCodesArray?.join(',');

		const url = new URL(
			rawParams.endpoint || `${this.NOMINATIM_ENDPOINT}/search`
		);
		Object.keys(params).forEach((key) =>
			url.searchParams.append(key, params[key])
		);

		if (countryCodes) {
			url.searchParams.append('countrycodes', countryCodes);
		}

		return fetchJSON(url.toString())
			.then((r) => (r.length ? r.map((data) => ({...data, lng: data.lon})) : []));
	}

	/**
	 * Look up an array of given Open Street Map ids
	 * @param {OSMId[]} osmIds
	 * @param {ILookupParams} rawParams
	 * @returns {Promise<NominatimResult[]>}
	 */
	async lookupID(osmIds, rawParams) {
		const params = this.normalizeParams(rawParams);

		const url = new URL(
			rawParams.endpoint || `${this.NOMINATIM_ENDPOINT}/lookup`
		);
		Object.keys(params).forEach((key) =>
			url.searchParams.append(key, params[key])
		);

		url.searchParams.append(
			'osm_ids',
			osmIds.map(this.stringifyOsmId).join(',')
		);

		return fetch(url.toString()).then((res) => res.json());
	}
}
