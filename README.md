ZBee
====

A NodeJS module for communicating with Zigbee devices using an XBee.

Implements Zigbee Cluster Library (ZCL), and the Zigbee Device Profile (ZDP) of the Zigbee Device Object (ZDO).

A web app is provided for discovering and configuring Zigbee devices on the network.
	> node app.js

Emphasis will initially be on implementing the HA profile.

Goals
-----
The goal of this library is to provide enough functionality to create and configure a network of Zigbee devices for use in an 
automation and monitoring scenario.

A comprehensive, nice looking end-user panel UI is a separate project (see Whims) that interfaces with multiple subsystems via
Meem protocol over MQTT.  (e.g. Zigbee, Nest thermostat, Belkin Wemo, X10, Raven Smart energy USB stick, Pioneer AV)

The MQTT part will either be in a separate project or an "example" application in this project.

Status
------

A Web GUI is provided that allows discovery of Nodes and Endpoints.

Binding and attribute reports are now manageable in the library, but the UI does not provide a nice way to do so as yet.

TODO
----

- store configuration details: name of system, serial port details, MQTT settings
- create a proper spec for abstraction of Zigbee details for the web protocol and MQTT
- refactor code so that code for interfacing with clusters may be added incrementally
- provide proper responses to commands from remote devices.
- system configuration.  Scan for usable serial ports for XBee.
- GUI for Zigbee network configuration: 
	- join network, 
	- discover nodes, 
	- discover endpoints, 
	- set labels and locations, 
	- manage bindings, 
	- manage attribute reports
- interface to Meem MQTT

