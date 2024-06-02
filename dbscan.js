'use strict';
/*global L:readonly*/


/**
 * Performs DBSCAN clustering on a set of points, uses m/km for distance.
 * 
 * Example usage
 ```
  const points = [
    [40.66, -73.94],
    [41.83, -87.68],
    [37.77, -122.42],
    [34.05, -118.24],
    [40.67, -73.94]
  ];
  const clusters = DBSCAN(points, 50000);
	```
 * @param {number[][]} points - Array of [latitude, longitude] points.
 * @param {number} maxDistM - Distance threshold for clustering in meters.
 * @param {number} minCluster - Minimum number of points to consider a cluster
 * @returns {number[][][]} - Array of clusters, each containing arrays of points.
 */
const DBSCAN = (points, maxDistM, minCluster = 2) => {
	const clusters = [];
	const visited = new Set();
	const noise = [];

	/**
	 * Finds all neighbors within the distance threshold.
	 * @param {number[]} point - A point [latitude, longitude].
	 * @returns {number[]} - Array of indices of neighboring points.
	 */
	const regionQuery = point => {
		const neighbors = [];
		for (let i = 0; i < points.length - 1; i++) {
			const pointA = L.latLng(point);
			const pointB = L.latLng(points[i + 1]);

			if (pointA.distanceTo(pointB) <= maxDistM) {
				neighbors.push(i);
			}
		}
		return neighbors;
	};

	/**
	 * Expands a cluster from a given point.
	 * @param {number} pointIndex - Index of the starting point.
	 * @param {number[]} neighbors - Array of indices of neighboring points.
	 * @param {number[]} cluster - The cluster being expanded.
	 */
	const expandCluster = (pointIndex, neighbors, cluster) => {
		cluster.push(pointIndex);
		for (let i = 0; i < neighbors.length; i++) {
			const neighborIndex = neighbors[i];
			if (!visited.has(neighborIndex)) {
				visited.add(neighborIndex);
				const neighborNeighbors = regionQuery(points[neighborIndex]);
				if (neighborNeighbors.length >= minCluster) {
					neighbors = neighbors.concat(neighborNeighbors);
				}
			}
			if (!clusters.some(c => c.includes(neighborIndex))) {
				cluster.push(neighborIndex);
			}
		}
	};

	for (let i = 0; i < points.length; i++) {
		if (!visited.has(i)) {
			visited.add(i);
			const neighbors = regionQuery(points[i]);
			if (neighbors.length < minCluster) {
				noise.push(i);
			} else {
				const cluster = [];
				expandCluster(i, neighbors, cluster);
				clusters.push(cluster);
			}
		}
	}

	return clusters.map(cluster => cluster.map(index => points[index]));
};

export default DBSCAN;
