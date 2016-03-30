/**
 * MPR121 
 * 
 * Access the MPR121 chipset via node-i2c
 * 
 * --------------------------------------------------------------------------------------------------------------------
 * 
 * @author Amely Kling <mail@dwi.sk>
 *
 */

/* Node Inclues
 * ==================================================================================================================== */

var i2c = require('i2c-bus');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

/* Constants
 * ==================================================================================================================== */

// Register addresses.
var MPR121_I2CADDR_DEFAULT = 0x5A;
var MPR121_TOUCHSTATUS_L   = 0x00;
var MPR121_TOUCHSTATUS_H   = 0x01;
var MPR121_FILTDATA_0L     = 0x04;
var MPR121_FILTDATA_0H     = 0x05;
var MPR121_BASELINE_0      = 0x1E;
var MPR121_MHDR            = 0x2B;
var MPR121_NHDR            = 0x2C;
var MPR121_NCLR            = 0x2D;
var MPR121_FDLR            = 0x2E;
var MPR121_MHDF            = 0x2F;
var MPR121_NHDF            = 0x30;
var MPR121_NCLF            = 0x31;
var MPR121_FDLF            = 0x32;
var MPR121_NHDT            = 0x33;
var MPR121_NCLT            = 0x34;
var MPR121_FDLT            = 0x35;
var MPR121_TOUCHTH_0       = 0x41;
var MPR121_RELEASETH_0     = 0x42;
var MPR121_DEBOUNCE        = 0x5B;
var MPR121_CONFIG1         = 0x5C;
var MPR121_CONFIG2         = 0x5D;
var MPR121_CHARGECURR_0    = 0x5F;
var MPR121_CHARGETIME_1    = 0x6C;
var MPR121_ECR             = 0x5E;
var MPR121_AUTOCONFIG0     = 0x7B;
var MPR121_AUTOCONFIG1     = 0x7C;
var MPR121_UPLIMIT         = 0x7D;
var MPR121_LOWLIMIT        = 0x7E;
var MPR121_TARGETLIMIT     = 0x7F;
var MPR121_GPIODIR         = 0x76;
var MPR121_GPIOEN          = 0x77;
var MPR121_GPIOSET         = 0x78;
var MPR121_GPIOCLR         = 0x79;
var MPR121_GPIOTOGGLE      = 0x7A;
var MPR121_SOFTRESET       = 0x80;


/* Class Constructor
 * ==================================================================================================================== */


function MPR121(address, bus_number) {
	EventEmitter.call(this);

	this.address = address || MPR121_I2CADDR_DEFAULT;
	if (bus_number != undefined) {
		this.bus_number = bus_number;
	} else {
		this.bus_number = 1;
	}
}

// MPR121 inherits EventEmitter
util.inherits(MPR121, EventEmitter);

// module export
module.exports = MPR121;


/* Variables
 * ==================================================================================================================== */

MPR121.prototype._device;
MPR121.prototype.address;
MPR121.prototype.bus_number = "1";


/* Methods
 * ==================================================================================================================== */

var _device;

/* 
 * Initialize communication with the MPR121. 
 *
 * Returns True if communication with the MPR121 was established, otherwise
 * returns False.
 */

MPR121.prototype.begin = function() {
	this._device = i2c.openSync(this.bus_number);
	return this.reset();
}


/*
 * get config value
 */

MPR121.prototype.config = function() {
	return this._read8Bits(MPR121_CONFIG2);
}


/*
 * reset sensor
 */

MPR121.prototype.reset = function(touch, release){
	// Soft reset of device.
	this._write8Bits(MPR121_SOFTRESET, 0x63);

	// Set electrode configuration to default values.
	this._write8Bits(MPR121_ECR, 0x00);

	//# Check CDT, SFI, ESI configuration is at default values.
	var c = this._read8Bits(MPR121_CONFIG2);
	if (c != 0x24) {
		console.log("MPR121 Error - device not found. Check address, bus and wiring. ("+c+" != 36)")
		return false;
	} 

	// Set threshold for touch and release to default values.
	this.set_thresholds(12, 6);
	// Configure baseline filtering control registers.
	this._write8Bits(MPR121_MHDR, 0x01);
	this._write8Bits(MPR121_NHDR, 0x01);
	this._write8Bits(MPR121_NCLR, 0x0E);
	this._write8Bits(MPR121_FDLR, 0x00);
	this._write8Bits(MPR121_MHDF, 0x01);
	this._write8Bits(MPR121_NHDF, 0x05);
	this._write8Bits(MPR121_NCLF, 0x01);
	this._write8Bits(MPR121_FDLF, 0x00);
	this._write8Bits(MPR121_NHDT, 0x00);
	this._write8Bits(MPR121_NCLT, 0x00);
	this._write8Bits(MPR121_FDLT, 0x00);	
	// Set other configuration registers.
	this._write8Bits(MPR121_DEBOUNCE, 0);
	this._write8Bits(MPR121_CONFIG1, 0x10); // default, 16uA charge current
	this._write8Bits(MPR121_CONFIG2, 0x20); // 0.5uS encoding, 1ms period
	// Enable all electrodes.
	this._write8Bits(MPR121_ECR, 0x8F); // start with first 5 bits of baseline tracking
	// All done, everything succeeded!

	return true;
}

/* 
 * Set the touch and release threshold for all inputs to the provided
 * values.  Both touch and release should be a value between 0 to 255
 * (inclusive).
 */

 MPR121.prototype.set_thresholds = function(touch, release) {
	if (touch < 0 || touch > 255) return false;
	if (release < 0 || release > 255) return false;

	for (var i = 0; i <= 12; i++) {
		this._write8Bits(MPR121_TOUCHTH_0 + 2 * i, touch);
		this._write8Bits(MPR121_RELEASETH_0 + 2 * i, release);
	}
}


/* 
 * Return filtered data register value for the provided pin (0-11).
 * Useful for debugging.
 */

 MPR121.prototype.filtered_data = function(pin) {
	if (pin < 0 || pin >= 12) { return false; }
	return this._read16Bits(MPR121_FILTDATA_0L + pin*2);
}


/* 
 * Return baseline data register value for the provided pin (0-11).
 * Useful for debugging.
 */

 MPR121.prototype.baseline_data = function(pin) {
	if (pin < 0 || pin >= 12) { return false; }
	var bl = this._read8Bits(MPR121_BASELINE_0 + pin);
	return bl << 2;
}


/* 
 * Return touch state of all pins as a 12-bit value where each bit 
 * represents a pin, with a value of 1 being touched and 0 not being touched.
 */ 

 MPR121.prototype.touched = function() {
	var t = this._read16Bits(MPR121_TOUCHSTATUS_L);
	return t & 0x0FFF;
}


/*
 * Return True if the specified pin is being touched, otherwise returns
 * False.
 */

 MPR121.prototype.is_touched = function(pin) {
	if (pin < 0 || pin >= 12) { return false; }
	var t = this.touched();
	return (t & (1 << pin)) > 0;
}

/* 
 * Several I2C Helpers
 */

MPR121.prototype._read8Bits = function(reg) {
	return this._device.readByteSync(this.address, reg);
};

MPR121.prototype._read16Bits = function(reg) {
	return this._device.readWordSync(this.address, reg);
};

MPR121.prototype._write8Bits = function(reg, value) {
	this._device.writeByteSync(this.address, reg, value & 0xFF);
};

