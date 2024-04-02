const NE_STATES =
{
	"Connecticut": {
		"cities": ["Hartford", "Bridgeport", "New Haven", "Stamford", "Waterbury"],
		"routes": [
			["Hartford", "Bridgeport", "New Haven"],
			["Hartford", "Stamford"],
			["Hartford", "Waterbury"]
		],
		"phases": [
			["Hartford", "Bridgeport", "New Haven"],
			["Hartford", "Stamford"],
			["Hartford", "Waterbury"]
		]
	},
	"Delaware": {
		"cities": ["Wilmington", "Dover", "Newark"],
		"routes": [
			["Wilmington", "Dover"],
			["Wilmington", "Newark"]
		],
		"phases": [
			["Wilmington", "Dover"],
			["Wilmington", "Newark"]
		]
	},
	"Maryland": {
		"cities": ["Baltimore", "Annapolis", "Frederick", "Rockville", "Gaithersburg"],
		"routes": [
			["Baltimore", "Annapolis"],
			["Baltimore", "Frederick", "Rockville", "Gaithersburg"]
		],
		"phases": [
			["Baltimore", "Annapolis"],
			["Baltimore", "Frederick", "Rockville", "Gaithersburg"]
		]
	},
	"Massachusetts": {
		"cities": ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
		"routes": [
			["Boston", "Worcester"],
			["Boston", "Springfield"],
			["Boston", "Cambridge", "Lowell"]
		],
		"phases": [
			["Boston", "Worcester"],
			["Boston", "Springfield"],
			["Boston", "Cambridge", "Lowell"]
		]
	},
	"New Jersey": {
		"cities": ["Newark", "Jersey City", "Trenton", "Atlantic City", "Camden", "Paterson"],
		"routes": [
			["Newark", "Jersey City", "Newark", "Trenton"],
			["Atlantic City", "Camden", "Newark", "Paterson"]
		],
		"phases": [
			["Newark", "Jersey City", "Newark", "Trenton"],
			["Atlantic City", "Camden", "Newark", "Paterson"]
		]
	},
	"New York": {
		"cities": ["New York City", "Buffalo", "Albany", "Syracuse", "Rochester"],
		"routes": [
			["New York City", "Buffalo", "New York City", "Albany"],
			["New York City", "Syracuse", "Rochester"]
		],
		"phases": [
			["New York City", "Buffalo", "New York City", "Albany"],
			["New York City", "Syracuse", "Rochester"]
		]
	},
	"Pennsylvania": {
		"cities": ["Erie", "Pittsburgh", "Harrisburg", "Philadelphia"],
		"routes": [
			["Erie", "Pittsburgh"],
			["Harrisburg", "Philadelphia"]
		],
		"phases": [
			["Erie", "Pittsburgh"],
			["Harrisburg", "Philadelphia"]
		]
	},
	"Virginia": {
		"cities": ["Richmond", "Norfolk", "Virginia Beach", "Alexandria", "Arlington", "Newport News"],
		"routes": [
			["Richmond", "Norfolk", "Virginia Beach"],
			["Richmond", "Alexandria", "Arlington", "Newport News"]
		],
		"phases": [
			["Richmond", "Norfolk", "Virginia Beach"],
			["Richmond", "Alexandria", "Arlington", "Newport News"]
		]
	}
}
export default NE_STATES;