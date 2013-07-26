/**
 * Zigbee Device Object
 * 
 * A protocol in the ZigBee protocol stack, ZDO is responsible for overall device management, and security 
 * keys and policies.
 * 
 * ZDO has its own profile, known as the ZigBee Device Profile (ZDP), which the application end points and 
 * other ZigBee nodes can access.
 * 
 * The ZigBee Device Profile has an application profile identifier of 0x0000. All ZigBee devices support a 
 * reserved endpoint called the ZigBee Device Objects (ZDO) endpoint. The ZDO endpoint runs on 
 * endpoint 0 and supports clusters in the ZigBee Device Profile. All devices that support the ZigBee Device 
 * Profile clusters support endpoint 0.
 * 
 * ZDO services include the following features:
 * - View the neighbor table on any device in the network
 * - View the routing table on any device in the network
 * - View the end device children of any device in the network
 * - Obtain a list of supported endpoints on any device in the network
 * - Force a device to leave the network
 * - Enable or disable the permit-joining attribute on one or more devices
 * 
 * 
 * ZigBee Device Objects contain six Objects: 38
 * - Network Manager
 * - Security Manager
 * - Device and Service Discovery
 * - Binding Manager
 * - Node Manager
 * - Group Manager
 */

var util = require("util");
var EventEmitter = require("events").EventEmitter;
var HA = require("./ha");

var DeviceNames = HA.DeviceNames;
var ClusterNames = HA.ClusterNames;

var ZDO = exports.ZDO = function(zbee, node) {
	EventEmitter.call(this);
	this.zbee = zbee;
	this.node = node;
}
util.inherits(ZDO, EventEmitter);

/**
 * Broadcast transmission used to discover the 16-bit (network) address of a remote 
 * device with a matching 64-bit address.
 */
ZDO.prototype.requestNetworkAddress = function(requestType, cb) {
	var self = this;
	if (typeof requestType === 'function') {
		cb = requestType;
		requestType = RequestType.SingleDeviceResponse;
	}
	else if (typeof requestType === 'undefined') {
		requestType = RequestType.SingleDeviceResponse;
	}
	var startIndex = 0;
	var clusterId = ClusterId.ZDP_NwkAddrReq;	// Network Address Request
	
	var arr = [];
	arr = arr.concat(this.node.remote64.dec);
	arr.push(requestType);
	arr.push(startIndex);
	var data = new Buffer(arr);
	
	this.node.sendZdoCommand(clusterId, data, function(err, packet) {
		if (err) {
			console.log("problem sending Network Address Request: " + util.inspect(err));
		}
		else {
			self._handleNetworkAddressResponse(packet, null, cb);
		}
	});	
}

/**
 * used to discover the node descriptor of a device with a matching 16-bit address.
 */
ZDO.prototype.requestNodeDescriptor = function(cb) {
	console.log("sending Node Descriptor Request");
	var address = this.node.remote16.dec;
	var clusterId = ClusterId.ZDP_NodeDescReq;	// Node Descriptor Request
	var data = new Buffer([address[1], address[0]]);
	this.node.sendZdoCommand(clusterId, data, function(err, packet) {
		if (err) {
			console.log("problem sending Node Descriptor Request: " + util.inspect(err));
		}
		else {
			console.log("sent Node Descriptor Request");
		}
	});
}

/**
 * used to discover the simple descriptor of a device with a matching 16-bit address.
 */
ZDO.prototype.requestSimpleDescriptor = function(endpoint, cb) {
	var self = this;
	//console.log("sending Simple Descriptor Request");
	var address = this.node.remote16.dec;
	var clusterId = ClusterId.ZDP_SimpleDescReq;	// Simple Descriptor Request
	var data = new Buffer([address[1], address[0], endpoint]);
	this.node.sendZdoCommand(clusterId, data, function(err, packet) {
		if (err) {
			console.log("problem sending Simple Descriptor Request: " + util.inspect(err));
		}
		else {
			self._handleSimpleDescriptorResponse(packet, null, cb);
		}
	});
}

/**
 * used to discover the active endpoints on a device with a matching 16-bit address.
 */
ZDO.prototype.requestActiveEndpoints = function(cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var clusterId = ClusterId.ZDP_ActiveEpReq;	// Active Endpoints Request
	var data = new Buffer([address[1], address[0]]);
	
	//console.log("sending Active Endpoints Request");
	this.node.sendZdoCommand(clusterId, data, function(err, packet) {
		if (err) {
			//console.log("problem sending Active Endpoints Request: " + util.inspect(err));
			cb(err);
		}
		else {
			self._handleActiveEndpointsResponse(packet, null, cb);
		}
	});
}

ZDO.prototype.requestNetworkDiscovery = function(cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var clusterId = ClusterId.ZDP_MgmtNwkDiscReq;	// Management Network Discovery Request
	var data = new Buffer([address[1], address[0]]);
	
	//console.log("sending Active Endpoints Request");
	this.node.sendZdoCommand(clusterId, data, function(err, packet) {
		if (err) {
			//console.log("problem sending Active Endpoints Request: " + util.inspect(err));
			cb(err);
		}
		else {
			var result = {
				status : packet.rawData[1],
			};
			if (result.status == 0) {
				result.addr = packet.rawData.slice(2,4);
				result.endpoints = packet.rawData.slice(5);
				self.emit("endpoints", result);
			}
			else {
				// TODO map status to message
				err = new Error("Bad status from Active Endpoints Request: " + result.status);
			}
			cb(err, result);
		}
	});
}

/**
 * For unparsed explicit messages
 */
ZDO.prototype.handleRx = function(packet, data) {
	switch(packet.clusterId) {
		case 0x8000:	// Network Address Response
			this._handleNetworkAddressResponse(packet, data);
			break;
		case 0x8001:	// IEEE Address Response
			this._handleIeeeAddressResponse(packet, data);
			break;
		case 0x8002:	// Node Descriptor Response
			this._handleNodeDescriptorResponse(packet, data);
			break;
		case 0x8004:	// Simple Descriptor Response
			this._handleSimpleDescriptorResponse(packet, data);
			break;
		case ClusterId.ZDP_ActiveEpRsp:
		case 0x8005:	// Active Endpoints Response
			this._handleActiveEndpointsResponse(packet, data);
			break;
		case 0x8006:	// Match Descriptor Response
			this._handleMatchDescriptorResponse(packet, data);
			break;
		case 0x8010:	// Complex Descriptor Response
			this._handleComplexDescriptorResponse(packet, data);
			break;
		case 0x8011:	// User Descriptor Response
			this._handleUserDescriptorResponse(packet, data);
			break;
			
		case ClusterId.ZDP_EndDeviceAnnce:
			this._handleEndDeviceAnnounce(packet, data);
			break;
			
		case 0x8030:	// Management Network Discovery Response
			this._handleManagementNetworkResponse(packet, data);
			break;
		case 0x8031:	// Management LQI (Neighbor Table) Response
			this._handleManagementLqiResponse(packet, data);
			break;
		case 0x8032:	// Management Rtg (Routing Table) Response
			this._handleManagementRtgResponse(packet, data);
			break;
		case 0x8034:	// Management Leave Response
			this._handleManagementLeaveResponse(packet, data);
			break;
		case 0x8036:	// Management Permit Join Response
			this._handleManagementPermitJoinResponse(packet, data);
			break;
		case 0x8038:	// Management Network Update Notify
			this._handleManagementNetworkUpdate(packet, data);
			break;
	}
}

ZDO.prototype._handleNetworkAddressResponse = function(packet, data, cb) {
	//console.log("got Network Address Response: " + util.inspect(packet));
	var data = packet.rawData;
	var err = null;
	var response = { status : data[1]}
	if (data.length >= 12 ) {
		response.address16 = [packet.rawData[11], packet.rawData[10]];
		response.address64 = [packet.rawData[9], packet.rawData[8], packet.rawData[7], packet.rawData[6], packet.rawData[5], packet.rawData[4], packet.rawData[3], packet.rawData[2]];
		
		// TODO get associated addresses
	}
	
	var msg = "";
	switch(response.status) {
	case 0x80:	// INV_REQUESTTYPE
		msg = "The supplied request type was invalid.";
		err = new Error("Error status in Network Address Response.  " + msg);
		break;
	case 0x81:	// DEVICE_NOT_FOUND
		msg = "The requested device did not exist on a device following a child descriptor request to a parent.";
		err = new Error("Error status in Network Address Response.  " + msg);
		break;
	}

	if (typeof cb != 'undefined') {
		cb(err, response)
	}
}

ZDO.prototype._handleIeeeAddressResponse = function(packet, data) {
	console.log("got IEEE Address Response");
}

ZDO.prototype._handleNodeDescriptorResponse = function(packet, data) {
	console.log("got Node Descriptor Response");
}

ZDO.prototype._handleSimpleDescriptorResponse = function(packet, data, cb) {
	var desc = {};
	var i = 1;				// skip transaction id
	var data = packet.rawData;
	desc.status = data[i++];
	desc.address = [data[i++]];
	desc.address.unshift(data[i++]);
	var len = data[i++];
	if (len > 0) {
		desc.endpoint = data[i++];
		desc.profileId = (data[i++] & 0xFF) | (data[i++] << 8);
		desc.deviceId = (data[i++] & 0xFF) | (data[i++] << 8);
		desc.deviceVersion = (data[i++] & 0xF0) >> 4;
		desc.deviceName = DeviceNames[desc.deviceId];
		
		desc.inputClusters  = [];	// input clusters
		var inCount = data[i++];
		for (var c=0; c<inCount; c++) {
			var clusterId = (data[i++] & 0xFF) | (data[i++] << 8);
			var name = ClusterNames[clusterId];
			desc.inputClusters.push({ id: clusterId, name: name });
		}
		desc.outputClusters = [];	// output clusters
		var outCount = data[i++];
		for (var c=0; c<outCount; c++) {
			var clusterId = (data[i++] & 0xFF) | (data[i++] << 8);
			var name = ClusterNames[clusterId];
			desc.outputClusters.push({ id: clusterId, name: name });
		}
	}
	
	console.log("got Simple Descriptor Response: " + util.inspect(desc));
	
	if (typeof cb != 'undefined') {
		cb(null, desc);
	}
}

/**
 * 
 */
ZDO.prototype._handleActiveEndpointsResponse = function(packet, data, cb) {
	var err = null;
	var result = {
			status : packet.rawData[1],
	};
	
	if (result.status == 0) {
		var numEndpoints = packet.rawData[4];
		var address16 = [];
		address16[0] = packet.rawData[3];
		address16[1] = packet.rawData[2];
		
		result.address = address16;
		result.endpoints = packet.rawData.slice(5);
		
		this.emit("endpoints", result);		// one byte per endpoint 
	}
	else {
		// TODO map status to message
		err = new Error("Bad status from Active Endpoints Request: " + result.status);
	}

	//console.log(">>> Active Endpoints Response: " + util.inspect(result));

	if (typeof cb != 'undefined') {
		cb(null, result);
	}
}

ZDO.prototype._handleMatchDescriptorResponse = function(packet, data) {
	console.log("got Match Descriptor Response");
}

ZDO.prototype._handleComplexDescriptorResponse = function(packet, data) {
	console.log("got Complex Descriptor Response");
}

ZDO.prototype._handleUserDescriptorResponse = function(packet, data) {
	console.log("got User Descriptor Response");
}

ZDO.prototype._handleEndDeviceAnnounce = function(packet, data, cb) {
	var data = packet.rawData;
	var announce = {};
	announce.address16 = [packet.rawData[2], packet.rawData[1]];
	announce.address64 = [packet.rawData[10], packet.rawData[9], packet.rawData[8], packet.rawData[7], packet.rawData[6], packet.rawData[5], packet.rawData[4], packet.rawData[3]];
	announce.capability = packet.rawData[11];
	
	console.log("Node " + this.node.remote64.hex + " got End Device Announce: " + util.inspect(announce));

	this.emit("deviceAnnounce", announce);
	
	if (typeof cb != 'undefined') {
		cb(null, announce);
	}
}


ZDO.prototype._handleManagementNetworkResponse = function(packet, data) {
	console.log("got Management Network Response");
}

ZDO.prototype._handleManagementLqiResponse = function(packet, data) {
	console.log("got Management Lqi Response");
}

ZDO.prototype._handleManagementRtgResponse = function(packet, data) {
	console.log("got Management Rtg Response");
}

ZDO.prototype._handleManagementLeaveResponse = function(packet, data) {
	console.log("got Management Leave Response");
}

ZDO.prototype._handleManagementPermitJoinResponse = function(packet, data) {
	console.log("got Management Permit Join Response");
}

ZDO.prototype._handleManagementNetworkUpdate = function(packet, data) {
	console.log("got Management Network Update");
}

/**
 * Send an EndDevice Announce to the Coordinator
 * [ Sequence Number] + [16-bit address] + [64-bit address] + [Capability]
 */
ZDO.prototype.deviceAnnounce = function(packet) {
}

/**
 * Check whether packet is for the ZDO Endpoint
 */
var isZdo = function(packet) {
	return (packet.profileId == 0);
}

//var ClusterNames = {
//	0x0014: "User Descriptor Set"
//}

/**
 * Request type for Network Address Request
 */
var RequestType = exports.RequestType = {
	SingleDeviceResponse: 0x00,
	ExtendedResponse: 0x01
}


var StatusValue = {
	ZDP_SUCCESS_VALID: 0x00,
	ZDP_INV_REQUESTTYPE: 0x80,
	ZDP_DEVICE_NOT_FOUND: 0x81,
	ZDP_INV_EP: 0x82 ,
	ZDP_NOT_ACTIVE: 0x83 ,
	ZDP_NOT_SUPPORTED: 0x84 ,
	ZDP_TIMEOUT: 0x85 ,
	ZDP_NO_MATCH: 0x86 ,
	ZDP_TABLE_FULL: 0x87 ,
	ZDP_NO_ENTRY: 0x88 ,
	ZDP_NO_DESCRIPTOR: 0x89
};

var ClusterId = {
	ZDP_NwkAddrReq: 0x00 ,
	ZDP_IeeeAddrReq: 0x01 ,
	ZDP_NodeDescReq: 0x02 ,
	ZDP_PowerDescReq: 0x03 ,
	ZDP_SimpleDescReq: 0x04 ,
	ZDP_ActiveEpReq: 0x05 ,
	ZDP_MatchDescReq: 0x06 ,
	ZDP_ComplexDescReq: 0x10 ,
	ZDP_UserDescReq: 0x11 ,
	ZDP_DiscoveryRegisterReq: 0x12 ,
	ZDP_EndDeviceAnnce: 0x13 ,
	ZDP_UserDescSet: 0x14 ,
	ZDP_EndDeviceBindReq: 0x20 ,
	ZDP_BindReq: 0x21 ,
	ZDP_UnbindReq: 0x22 ,
	ZDP_MgmtNwkDiscReq: 0x30 ,
	ZDP_MgmtLqiReq: 0x31 ,
	ZDP_MgmtRtgReq: 0x32 ,
	ZDP_MgmtBindReq: 0x33 ,
	ZDP_MgmtLeaveReq: 0x34 ,
	ZDP_MgmtDirectJoinReq: 0x35 ,

	ZDP_NwkAddrRsp: 0x80 ,
	ZDP_IeeeAddrRsp: 0x81 ,
	ZDP_NodeDescRsp: 0x82 ,
	ZDP_PowerDescRsp: 0x83 ,
	ZDP_SimpleDescRsp: 0x84 ,
	ZDP_ActiveEpRsp: 0x85,
	ZDP_MatchDescRsp: 0x86 ,
	ZDP_ComplexDescRsp: 0x90 ,
	ZDP_UserDescRsp: 0x91 ,
	ZDP_DiscoveryRegisterRsp: 0x92 ,
	//ZDP_EndDeviceAnnceRsp: 0x93 ,
	ZDP_UserDescConf: 0x94 ,
	ZDP_EndDeviceBindRsp: 0xA0 ,
	ZDP_BindRsp: 0xA1 ,
	ZDP_UnbindRsp: 0xA2 ,
	ZDP_MgmtNwkDiscRsp: 0xB0 ,
	ZDP_MgmtLqiRsp: 0xB1 ,
	ZDP_MgmtRtgRsp: 0xB2 ,
	ZDP_MgmtBindRsp: 0xB3 ,
	ZDP_MgmtLeaveRsp: 0xB4 ,
	ZDP_MgmtDirectJoinRsp: 0xB5 ,
	ZDP_Zdo64bitAddressing: 0xFF
};