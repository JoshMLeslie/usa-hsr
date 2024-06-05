export const getBoundsForBox = (map) => {
	const NW = map.getBounds().getNorthWest();
	return [
		NW,
		map.getBounds().getNorthEast(),
		map.getBounds().getSouthEast(),
		map.getBounds().getSouthWest(),
		NW,
	];
};
