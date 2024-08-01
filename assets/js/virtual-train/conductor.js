export default class Conductor {
	constructor(train, locomotive, stops) {
		this.train = train;
		this.locomotive = locomotive;
		this.stops = stops;
		this.currentStopIndex = 0; // Start at the first stop
		this.direction = 1; // Default to moving forward, -1 for reverse
		this.isMoving = false;

		console.log("todo - 'movement' is missing distance between stops.");
		/**
		 * The train accelerates and decelerates, but knows nothing of
		 * its position. The conductor will know the distance between stops
		 * and when to trigger acceleration and deceleration based on this distance
		 * and subsequently update the current stop.
		 */
	}

	start() {
		if (this.isMoving) {
			console.log('The train is already moving.');
		} else {
			console.log(
				`The train is starting its journey from ${this.stops[0].city}.`
			);
			this.isMoving = true;
			this._move();
		}
	}

	stop() {
		if (this.isMoving) {
			console.log(`The train is stopping.`);
			clearInterval(this.intervalId); // Stop the movement
			this.locomotive.brake();
			this.isMoving = false;
		} else {
			console.log('The train is already stopped.');
		}
	}

	moveToNextStop() {
		if (this.isMoving) {
			if (
				this.direction === 1 &&
				this.currentStopIndex < this.stops.length - 1
			) {
				// Move forward
				this.currentStopIndex += 1;
				console.log(
					`Moving to next stop: ${this.stops[this.currentStopIndex].city}`
				);
			} else if (this.direction === -1 && this.currentStopIndex > 0) {
				// Move backward
				this.currentStopIndex -= 1;
				console.log(
					`Moving to previous stop: ${this.stops[this.currentStopIndex].city}`
				);
			} else {
				console.log('The train has reached the end of the line.');
				this.stop();
				if (this.direction === 1) {
					// Reverse direction and start over
					this.direction = -1;
					this.currentStopIndex -= 1; // Adjust for reversal
					console.log('The train is now reversing direction.');
				} else {
					// Reset to forward traversal
					this.currentStopIndex = 0;
					this.start(); // Restart the journey
					this.direction = 1; // Reset direction to forward
					console.log(
						'The train has completed a full route and is starting again.'
					);
				}
			}
		} else {
			console.log('The train must be moving to change location.');
		}
	}

	_move() {
		this.intervalId = setInterval(() => {
			if (this.isMoving) {
				// Accelerate the locomotive if not at max speed
				if (this.locomotive.currentSpeed < this.locomotive.maxSpeed) {
					this.locomotive.accelerate();
				}
				// Move to the next stop based on the direction
				const currentStop = this.stops[this.currentStopIndex];
				if (
					this.direction === 1 &&
					this.currentStopIndex < this.stops.length - 1
				) {
					this.locomotive.accelerate(); // Keep accelerating until reaching the next stop or max speed
				} else if (this.direction === -1 && this.currentStopIndex > 0) {
					this.locomotive.brake(); // Keep braking until stopping at the next stop or reaching zero speed
				} else {
					clearInterval(this.intervalId); // Stop moving if it's the last stop
				}
			}
		}, 1000); // Update every second
	}

	getStatus() {
		return {
			locomotive: this.train.getStatus(),
			route: this.route,
			currentStop: this.stops[this.currentStopIndex],
			passengerCapacity: this.passengerCapacity,
			passengerCount: this.passengerCount,
			carCount: this.carCount,
			carLength: this.carLength,
			currentStopIndex: this.currentStopIndex,
			isMoving: this.isMoving,
		};
	}
}
