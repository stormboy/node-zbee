/**
 * Zigbee HA Profile
 */

/**
 * Map of device IDs to device names
 */
var DeviceNames = exports.DeviceNames = {

	// Generic
	0x0000 : "On/Off Switch",
	0x0001 : "Level Control Switch",
	0x0002 : "On/Off Output",
	0x0003 : "Level Controllable Output",
	0x0004 : "Scene Selector",
	0x0005 : "Configuration Tool",
	0x0006 : "Remote Control",
	0x0007 : "Combined Interface",
	0x0008 : "Range Extender",
	0x0009 : "Mains Power Outlet",
	0x000A : "Door Lock",
	0x000B : "Door Lock Controller",
	0x000C : "Simple Sensor",
	// 0x000C– 0x00FF: "Reserved",

	// Lighting
	0x0100 : "On/Off Light",
	0x0101 : "Dimmable Light",
	0x0102 : "Color Dimmable Light",
	0x0103 : "On/Off Light Switch",
	0x0104 : "Dimmer Switch",
	0x0105 : "Color Dimmer Switch",
	0x0106 : "Light Sensor",
	0x0107 : "Occupancy Sensor",
	// 0x0108 – 0x1FF: "Reserved",

	// Closures
	0x0200 : "Shade",
	0x0201 : "Shade Controller",
	0x0202 : "Window Covering Device",
	0x0203 : "Window Covering Controller",
	// 0x0204 – 0x2FF: "Reserved",

	// HVAC
	0x0300 : "Heating/Cooling Unit",
	0x0301 : "Thermostat",
	0x0302 : "Temperature Sensor",
	0x0303 : "Pump",
	0x0304 : "Pump Controller",
	0x0305 : "Pressure Sensor",
	0x0306 : "Flow Sensor",
	// 0x0307 - 0x3FF: "Reserved",

	// Intruder Alarm System
	0x0400 : "IAS Control and Indicating Equipment",
	0x0401 : "IAS Ancillary Control Equipment",
	0x0402 : "IAS Zone",
	0x0403 : "IAS Warning Device",
// 0x0404-0xFFFF: "Reserved",
};

/**
 * Map of cluster IDs to cluster names
 */
var ClusterNames = exports.ClusterNames = {

	// General
	0x0000 : "Basic",
	0x0001 : "Power Configuration",
	0x0002 : "Device Temperature Configuration",
	0x0003 : "Identify",
	0x0004 : "Groups",
	0x0005 : "Scenes",
	0x0006 : "On/Off",
	0x0007 : "On/Off Switch Configuration",
	0x0008 : "Level control",
	0x0009 : "Alarms",
	0x000F : "Binary Input (Basic)",

	// Measurement & Sensing
	0x0400 : "Illuminance Measurement",
	0x0401 : "Illuminance Level Sensing",
	0x0402 : "Temperature Measurement",
	0x0403 : "Pressure Measurement",
	0x0404 : "Flow Measurement",
	0x0405 : "Relative Humidity Measurement",
	0x0406 : "Occupancy sensing",

	// Lighting
	0x0300 : "Color Control",

	// HV AC
	0x0200 : "Pump Configuration and Control",
	0x0201 : "Thermostat",
	0x0202 : "Fan Control",
	0x0204 : "Thermostat User Interface Configuration",

	// Closures
	0x0100 : "Shade Configuration",
	0x0101 : "Door Lock",
	0x0102 : "Window Covering",

	// Security and Safety
	0x0501 : "IAS ACE",
	0x0500 : "IAS Zone",
	0x0502 : "IAS WD",

	// Smart Energy
	0x0702 : "Meter",
};