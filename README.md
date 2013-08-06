ZBee
====

A NodeJS module for communicating with Zigbee devices using an XBee (series 2).  The module allows communication with 
nodes' Zigbee Device Object (ZDO) and application objects (endpoints).

A web app is provided for discovering and configuring Zigbee devices on the network.  First edit config.js to set 
your serial port and then run:

	> node app.js

Emphasis of this project will initially be on implementing the HA profile.

Goals
-----
The goal of this library is to provide enough functionality to create and configure a network of Zigbee devices for use in an 
automation and monitoring scenario.  This includes setting up bindings and attribute reporting.
This involves:
- providing an easy to use, high level API for communicating with Zigbee devices.
- provide a web-based GUI for administering a network.

A comprehensive, nice looking end-user GUI for every-day interaction with devices is a separate project.  See Whims 
(https://github.com/stormboy/whims) for a project that interfaces with multiple subsystems via Meem protocol over 
MQTT.  Subsystems include Zigbee, Nest thermostat, Belkin Wemo, X10, Raven Smart energy USB stick, Pioneer AV.

The glue between Zigbee and MQTT-based protocol will either be in a separate project or an "example" application 
in this project.

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

API
---

###Coordinator

####Functions

- allowJoin

- joinNetwork

- leaveNetwork

- discoverNodeEndpoints(address64, cb)

- discoverAttributes(addr64, endpoint, cluster, start, max, cb)

- addBinding(binding)

- configReporting(address64, data)
data incudes endpoint, clusterId, attributes

####Events

- initialized

- node

- device

- lifecycle

####TODO
- groups
- scenes

###ZBee

####Functions

- addNode
e.g. zbee.addNode(ZigbeeNode);

- bind
	- bind a cluster on one node with a cluster on another
	
- subscribe 
	- report on cluster attributes

####TODO
- groups
- scenes

####Events
- node
- deviceFound
- deviceUpdated
- attributeReport

###ZigbeeNode

####Functions
- sendZdoMessage
- sendZclMessage

####Events
- deviceFound
- deviceUpdated
- attributeReport

###ZigbeeDevice
This object represents an Application Object in a Node.  A ZigbeeDevice has clusters.

####Events
- attributeReport

###ZDO
There is one ZDO per ZigbeeNode.  Accessed via:
	> node.zdo

####Functions
- requestNetworkAddress

- requestIEEEAddress

- requestNodeDescriptor

- requestActiveEndpoints
	- gets the endpoints of the node, where devices
	
- requestSimpleDescriptor(endpoint)
	- gets device descriptor of device at endpoint
	
- requestComplexDescriptor
	- gets more details descriptor of node (if available)
	
- requestUserDescriptor
	- gets user descriptor (if available)
	
- setUserDescriptor(desc)
	- sets the (max 16 byte) user descriptor (if available)
	
- requestBind(binding)
	- sets a binding on the device to another device
	
- requestUnbind(binding)
	- (to do)
	- removed a binding on a device
	
- configureReporting

- requestNetworkDiscovery 
	- ???

####Events


###Cluster

Contains attributes

####Functions

General functions
- discoverAttributes
- readAttributes
- writeAttributes
- configureReporting

Cluster-dependend functions.
e.g.
	identify()
	sendOnOff(value)
	
####Events
attributeReport
