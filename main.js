import NE_STATES from "./states/states-ne.js";
import NE_COORDS from "./coords/NE-to-coord.js";

const USA_CENTER = [39.833, -98.583];
const NE_CENTER = [40.261354, -74.518535];

// INIT
// var map = L.map('map').setView(USA_CENTER, 4);
var map = L.map('map').setView(NE_CENTER, 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// INIT END

const draw = (...args) => {
    L.polyline(args, {
        // options tbd
    }).addTo(map)
}

// btn binding
document.querySelector('#usa-region-btn').onclick = () => {
    map.setView(USA_CENTER, 4);
}
document.querySelector('#north-east-region-btn').onclick = () => {
    map.setView(NE_CENTER, 6);

    Object.keys(NE_STATES).forEach(state => {
        const { cities, routes, phases } = NE_STATES[state];

        for (const routeIx in routes) {
            const route = routes[routeIx];
            const coords = route.map(r => NE_COORDS[state][r])
            draw(coords)
        }
    })
}