# Node_MPR121
Access the MPR121 chipset via node-i2c

Port of Adafruit_Python_MPR121 to node.js. So far tested on a beaglebone-black rev-c. But it should work on other devices as RasberryPi as well. 

## Example 
Showing a simple loop reading the touch status every 0.1ms

```js
// get library
var MPR121 = require('mpr121');

// setup sensor device id 0x5A and i2c-bus 1
var touchsensor = new MPR121(0x5A, 1);

// initiialze sensor, on success start script
if (touchsensor.begin()) {
	// message how to quit
	console.log('Press Ctrl-C to quit.');

	// Interval for reading the sonsor
	setInterval(function() {
		// get touch values
		var t = touchsensor.touched();

		// prepare some result array
		var ret = [];

		// loop through pins
		for (var i = 0; i < 12; i++) {
			// push status into sensor
			ret.push (touchsensor.is_touched(i));
		}
		
		// return status
		console.log(ret);

	},100);
};

```