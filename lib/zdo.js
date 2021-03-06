/**
 * Zigbee Device Object
 * 
 * ZDO is responsible for overall device management, and security keys and policies.
 * 
 * ZDO has its own profile, known as the ZigBee Device Profile (ZDP), which the application end points and 
 * other ZigBee nodes can access.
 * 
 * The ZigBee Device Profile has an application profile identifier of 0x0000. All ZigBee devices support a 
 * reserved endpoint called the ZigBee Device Objects (ZDO) endpoint. The ZDO runs on  endpoint 0 and 
 * supports clusters in the ZigBee Device Profile. 
 * All devices that support the ZigBee Device Profile clusters support endpoint 0.
 * 
 * ZDO services include the following features:
 * - View the neighbor table on any device in the network
 * - View the routing table on any device in the network
 * - View the end device children of any device in the network
 * - Obtain a list of supported endpoints on any device in the network
 * - Force a device to leave the network
 * - Enable or disable the permit-joining attribute on one or more devices
 * 
 * ZigBee Device Objects contain six Objects:
 * - Network Manager
 * - Security Manager
 * - Device and Service Discovery
 * - Binding Manager
 * - Node Manager
 * - Group Manager
 */

var util         = require("util");
var xbee         = require("svd-xbee");
var ZigbeeObject = require('./zobject').ZigbeeObject;
var ZDP          = require("./profiles/zdp");
var HA           = require("./profiles/ha");
var BindingType  = require("./zbee").BindingType;

var Tools        = xbee.Tools;
var StatusValue  = ZDP.StatusValues;
var ClusterId    = ZDP.ClusterIds;
var DeviceNames  = HA.DeviceNames;
var ClusterNames = HA.ClusterNames;

/**
 * Zigbee Device Object
 * extends ZigbeeObject (endpoint)
 */
var ZDO = exports.ZDO = function(node) {
	ZDO.super_.call(this, node, {endpoint: 0x0000, profileId: 0x00});
}
util.inherits(ZDO, ZigbeeObject);

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
	requestType = 0x01;
	var startIndex = 0;

//	var remote64 = { dec : [0, 0, 0, 0, 0, 0, 0xFF, 0xFF] };
//	var remote16 = { dec : [0xFF, 0xFE] };
	var remote64 = this.node.remote64;
	var remote16 = this.node.remote16;
	var arr = [];
	arr = arr.concat(this.node.remote64.dec);
	arr.push(requestType);
	if (requestType == RequestType.ExtendedResponse) {
		arr.push(startIndex);
	}
	var data = new Buffer(arr);
	
	this.zbee.sendZdoCommand(remote64, remote16, ClusterId.ZDP_NwkAddrReq, data, function(err, packet) {
		if (err) {
			console.log("problem sending Network Address Request: " + util.inspect(err));
		}
		else {
			self._handleNetworkAddressResponse(packet, cb);
		}
	});	
}

ZDO.prototype.requestIEEEAddress = function(requestType, cb) {
	cb(new Error("not yet implemented"));
}

/**
 * used to discover the node descriptor of a device with a matching 16-bit address.
 */
ZDO.prototype.requestNodeDescriptor = function(cb) {
	var self = this;
	//console.log("sending Node Descriptor Request");
	var address = this.node.remote16.dec;
	var data = new Buffer([address[1], address[0]]);
	this.node.sendZdoCommand(ClusterId.ZDP_NodeDescReq, data, function(err, packet) {
		if (err) {
			console.log("problem sending Node Descriptor Request: " + util.inspect(err));
			cb(err);
		}
		else {
			self._handleNodeDescriptorResponse(packet, cb);
		}
	});
}

/**
 * used to discover the active endpoints on a device with a matching 16-bit address.
 */
ZDO.prototype.requestActiveEndpoints = function(cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var data = new Buffer([address[1], address[0]]);
	
	//console.log("sending Active Endpoints Request");
	this.node.sendZdoCommand(ClusterId.ZDP_ActiveEpReq, data, function(err, packet) {
		if (err) {
			//console.log("problem sending Active Endpoints Request: " + util.inspect(err));
			cb(err);
		}
		else {
			self._handleActiveEndpointsResponse(packet, cb);
		}
	});
}

/**
 * Request the simple descriptor of an application object with a matching 16-bit address.
 */
ZDO.prototype.requestSimpleDescriptor = function(endpoint, cb) {
	var self = this;
	//console.log("sending Simple Descriptor Request");
	var address = this.node.remote16.dec;
	var data = new Buffer([address[1], address[0], endpoint]);
	this.node.sendZdoCommand(ClusterId.ZDP_SimpleDescReq, data, function(err, packet) {
		if (err) {
			console.log("problem sending Simple Descriptor Request: " + util.inspect(err));
		}
		else {
			self._handleSimpleDescriptorResponse(packet, cb);
		}
	});
}

/**
 * Management network discovery request.
 */
ZDO.prototype.requestNetworkDiscovery = function(cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var data = new Buffer([address[1], address[0]]);
	
	//console.log("sending Active Endpoints Request");
	this.node.sendZdoCommand(ClusterId.ZDP_MgmtNwkDiscReq, data, function(err, packet) {
		if (err) {
			//console.log("problem sending Network Discovery Request: " + util.inspect(err));
			cb(err);
		}
		else {
			self._handleManagementNetworkResponse(packet, cb);

		}
	});
}

ZDO.prototype.requestComplexDescriptor = function(cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var data = new Buffer([address[1], address[0]]);
	
	this.node.sendZdoCommand(ClusterId.ZDP_ComplexDescReq, data, function(err, packet) {
		if (err) {
			cb(err);
		}
		else {
			self._handleUserDescriptorResponse(packet, cb);
		}
	});
}

/**
 * Optional command
 */
ZDO.prototype.requestUserDescriptor = function(cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var data = new Buffer([address[1], address[0]]);
	
	this.node.sendZdoCommand(ClusterId.ZDP_UserDescReq, data, function(err, packet) {
		if (err) {
			cb(err);
		}
		else {
			self._handleUserDescriptorResponse(packet, cb);
		}
	});
}

/**
 * Optional command
 */
ZDO.prototype.setUserDescriptor = function(desc, cb) {
	var self = this;
	var address = this.node.remote16.dec;
	var data = [address[1], address[0]];
	var length = desc.length > 16 ? 16 : desc.length;
	data.push(length);
	for (var i=0; i<length; i++) {
		data.push(desc[i]);
	}
	
	this.node.sendZdoCommand(ClusterId.ZDP_UserDescReq, new Buffer(data), function(err, packet) {
		if (err) {
			cb(err);
		}
		else {
			//self._handleUserDescriptorResponse(packet, cb);
			cb(null, packet);
		}
	});
}

/**
 * To send to request coordinator who will manage the bind
 */
ZDO.prototype.endDeviceBind = function(binding, cb) {
	// TODO
}

/**
 * Bind one endpoint cluster to another.
 * 
 * binding: {
 *   sourceEndpoint: int(1)
 *   clusterId: int(2)
 *   type: BindingType
 *   destAddress: byte[8]
 *   destEndpoint: int(1)
 * }
 */
ZDO.prototype.requestBind = function(binding, cb) {
	console.log("binding:  " + util.inspect(binding));
	
	var self = this;
	//var address = binding.sourceAddress;
	var address = this.node.remote64.dec;
	var payload = [];
	for (var i=7; i>= 0; i--) {
		payload.push(binding.sourceAddress.dec[i]);
	}
	payload.push(binding.sourceEndpoint);
	payload.push(binding.clusterId & (255)); payload.push((binding.clusterId >> 8) & (255)); 
	payload.push(binding.type);
	if (binding.type == BindingType.Endpoint) {
		for (var i=7; i>= 0; i--) {
			payload.push(binding.destAddress.dec[i]);
		}
		payload.push(binding.destEndpoint);
	}
	else {
		// TODO group address
	}
	console.log("Sending binding:  " + util.inspect(binding) + " : " + util.inspect(payload));
	
	var data = new Buffer(payload);
	
	this.node.sendZdoCommand(ClusterId.ZDP_BindReq, data, function(err, packet) {
		if (err) {
			cb(err);
		}
		else {
			self._handleBindResponse(packet, cb);
		}
	});
}

/**
 * Remove a binding
 */
ZDO.prototype.requestUnbind = function(binding, cb) {
	// TODO
}

/**
 * For unparsed explicit messages.
 */
ZDO.prototype.handleRx = function(packet) {
	
	// TODO handle the folling incoming requests:
	//	ZDP_NwkAddrReq           : 0x0000,
	//	ZDP_IeeeAddrReq          : 0x0001,
	//	ZDP_NodeDescReq          : 0x0002,
	//	ZDP_PowerDescReq         : 0x0003,
	//	ZDP_SimpleDescReq        : 0x0004,
	//	ZDP_ActiveEpReq          : 0x0005,
	//	ZDP_MatchDescReq         : 0x0006,
	//	ZDP_ComplexDescReq       : 0x0010,
	//	ZDP_UserDescReq          : 0x0011,
	//	ZDP_DiscoveryRegisterReq : 0x0012,
	//	ZDP_EndDeviceAnnce       : 0x0013,
	//	ZDP_UserDescSet          : 0x0014,
	//	ZDP_EndDeviceBindReq     : 0x0020,
	//	ZDP_BindReq              : 0x0021,
	//	ZDP_UnbindReq            : 0x0022,
	//	ZDP_MgmtNwkDiscReq       : 0x0030,
	//	ZDP_MgmtLqiReq           : 0x0031,
	//	ZDP_MgmtRtgReq           : 0x0032,
	//	ZDP_MgmtBindReq          : 0x0033,
	//	ZDP_MgmtLeaveReq         : 0x0034,
	//	ZDP_MgmtDirectJoinReq    : 0x0035,

	switch(packet.clusterId) {
	
	case ClusterId.ZDP_EndDeviceAnnce:	// End Device announcement
		this._handleEndDeviceAnnounce(packet);
		break;
	
	case ClusterId.ZDP_NwkAddrRsp:	// Network Address Response
		this._handleNetworkAddressResponse(packet);
		break;
		
	case ClusterId.ZDP_IeeeAddrRsp:	// IEEE Address Response
		this._handleIeeeAddressResponse(packet);
		break;
		
	case ClusterId.ZDP_NodeDescRsp:	// Node Descriptor Response
		this._handleNodeDescriptorResponse(packet);
		break;
		
	case ClusterId.ZDP_SimpleDescRsp:	// Simple Descriptor Response
		this._handleSimpleDescriptorResponse(packet);
		break;
		
	case ClusterId.ZDP_ActiveEpRsp:			// Active Endpoints Response
		this._handleActiveEndpointsResponse(packet);
		break;
		
	case ClusterId.ZDP_MatchDescRsp:	// Match Descriptor Response
		this._handleMatchDescriptorResponse(packet);
		break;
		
	case ClusterId.ZDP_ComplexDescRsp:	// Complex Descriptor Response
		this._handleComplexDescriptorResponse(packet);
		break;
		
	case ClusterId.ZDP_UserDescRsp:	// User Descriptor Response
		this._handleUserDescriptorResponse(packet);
		break;
		
	case ClusterId.ZDP_BindRsp:
		this._handleBindResponse(packet);
		break;
		
	case ClusterId.ZDP_MgmtNwkDiscRsp:	// Management Network Discovery Response
		this._handleManagementNetworkResponse(packet);
		break;
		
	case ClusterId.ZDP_MgmtLqiRsp:	// Management LQI (Neighbor Table) Response
		this._handleManagementLqiResponse(packet);
		break;
		
	case ClusterId.ZDP_MgmtRtgRsp:	// Management Rtg (Routing Table) Response
		this._handleManagementRtgResponse(packet);
		break;
		
	case ClusterId.ZDP_MgmtLeaveRsp:	// Management Leave Response
		this._handleManagementLeaveResponse(packet);
		break;
		
	case 0x8036:	// Management Permit Join Response
		this._handleManagementPermitJoinResponse(packet);
		break;
		
	case 0x8038:	// Management Network Update Notify
		this._handleManagementNetworkUpdate(packet);
		break;
		
	default:
		console.log("got command for unhandled ZDO cluster: " + packet.clusterId);
		break;
	}
}

ZDO.prototype._handleNetworkAddressResponse = function(packet, cb) {
	//console.log("got Network Address Response: " + util.inspect(packet));
	var data = packet.rawData;
	var err = null;
	var response = { status : data[1]}
	if (data.length >= 12 ) {
		response.address16 = [data[11], data[10]];
		response.address64 = [data[9], data[8], data[7], data[6], data[5], data[4], data[3], data[2]];
		
		// get associated addresses
		if (data.length > 12) {
			var numAddresses = data[12];
			if (numAddresses > 0) {
				response.startIndex = data[13];		// TODO handle multiple address requests
				response.addresses = [];
				for (var i=0; i<numAddresses; i++) {
					var index = 14 + i + i;
					var addr = [data[index+1], data[index]];
					response.addresses.push(addr);
				}
			}
		}
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

ZDO.prototype._handleIeeeAddressResponse = function(packet, cb) {
	console.log("got IEEE Address Response");
}

ZDO.prototype._handleNodeDescriptorResponse = function(packet, cb) {
	console.log("got Node Descriptor Response");
	var response = {};
	
	// populate response from packet
	data = packet.rawData; 

	response.logicalType = data[0] & 0x07;
	response.complexDescriptorAvailable = (data[0] & 0x08) != 0;
	response.userDescriptorAvailable = (data[0] & 0x10) != 0;
	response.frequencyBand = data[1];
	response.macCapability = data[2];
	response.manufacturerCode = data[3] | ((data [4] << 8) & 0xFF00);
	response.maxBufferSize = data[5];
	response.maxInTransferSize = data[6] | ((data [7] << 8) & 0xFF00);
	response.serverMask = data[8] | ((data [9] << 8) & 0xFF00);
	response.maxOutTransferSize = data[10] | ((data [11] << 8) & 0xFF00);
	response.extActiveEndpointsAvailable = data[12] & 0x01;
	response.extSimpleDescsAvailable = data[12] & 0x02;

	if (typeof cb != 'undefined') {
		cb(null, response);
	}

}

ZDO.prototype._handleSimpleDescriptorResponse = function(packet, cb) {
	var desc = {};
	var i = 1;				// skip transaction id
	var data = packet.rawData;
	desc.status = data[i++];
	desc.address16 = Tools.bArr2HexStr([data[i+1], data[i]]);
	i += 2;
	var len = data[i++];
	if (len > 0) {
		desc.endpoint      = data[i++];
		desc.profileId     = (data[i++] & 0xFF) | (data[i++] << 8);
		desc.deviceId      = (data[i++] & 0xFF) | (data[i++] << 8);
		desc.deviceVersion = (data[i++] & 0xF0) >> 4;
		desc.deviceName    = DeviceNames[desc.deviceId];  // TODO either don't use names here or lookup profile devices names
		
		desc.inputClusters  = [];	// input clusters
		var inCount = data[i++];
		for (var c=0; c<inCount; c++) {
			var clusterId = (data[i++] & 0xFF) | (data[i++] << 8);
			var name = ClusterNames[clusterId];	// TODO either don't use names here or lookup profile clusters names
			desc.inputClusters.push({ id: clusterId, name: name });
		}
		desc.outputClusters = [];	// output clusters
		var outCount = data[i++];
		for (var c=0; c<outCount; c++) {
			var clusterId = (data[i++] & 0xFF) | (data[i++] << 8);
			var name =  [clusterId]; // TODO either don't use names here or lookup profile clusters names
			desc.outputClusters.push({ id: clusterId, name: name });
		}
	}
	
	//console.log("got application Simple Descriptor Response: " + util.inspect(desc));
	
	this.emit("simpleDescriptor", desc);

	if (typeof cb != 'undefined') {
		cb(null, desc);
	}
}

/**
 * 
 */
ZDO.prototype._handleActiveEndpointsResponse = function(packet, cb) {
	var err = null;
	var result = {
			status : packet.rawData[1],
	};
	
	if (result.status == 0) {
		result.address16 = Tools.bArr2HexStr([packet.rawData[3], packet.rawData[2]]);
		result.numEndpoints = packet.rawData[4];		
		result.endpoints = packet.rawData.slice(5);

		this.emit("endpoints", result);		// one byte per endpoint 
	}
	else {
		// TODO map status to message
		err = new Error("Bad status from Active Endpoints Request: " + result.status);
	}

	//console.log(">>> Active Endpoints Response: " + util.inspect(result));

	if (typeof cb != 'undefined') {
		cb(err, result);
	}
}

ZDO.prototype._handleMatchDescriptorResponse = function(packet, cb) {
	console.log("got Match Descriptor Response");
}

ZDO.prototype._handleComplexDescriptorResponse = function(packet, cb) {
	console.log("got Complex Descriptor Response");
}

ZDO.prototype._handleUserDescriptorResponse = function(packet, cb) {
	console.log("got User Descriptor Response");

	var data = packet.rawData;
	var result = {};
	result.status = data[0];
	result.address = data[1] | (data[2] << 8);
	var length = data[3];
	result.data = data.slice(4);

	// TODO check status for error
	
	if (typeof cb != 'undefined') {
		cb(null, result);
	}
}

ZDO.prototype._handleEndDeviceAnnounce = function(packet, cb) {
	var data = packet.rawData;
	var announce = {};
	announce.address16 = [packet.rawData[2], packet.rawData[1]];
	announce.address64 = [packet.rawData[10], packet.rawData[9], packet.rawData[8], packet.rawData[7], packet.rawData[6], packet.rawData[5], packet.rawData[4], packet.rawData[3]];
	announce.capability = packet.rawData[11];
	
	console.log("Node " + this.node.remote64.hex + " got End Device Announce: " + util.inspect(announce));

	this.emit("announce", announce);
	
	if (typeof cb != 'undefined') {
		cb(null, announce);
	}
}


ZDO.prototype._handleManagementNetworkResponse = function(packet, cb) {
	console.log("got Management Network Response");
	
//	var result = {
//			status : packet.rawData[1],
//		};
//		if (result.status == 0) {
//			result.addr = packet.rawData.slice(2,4);
//			result.endpoints = packet.rawData.slice(5);
//			self.emit("endpoints", result);
//		}
//		else {
//			// TODO map status to message
//			err = new Error("Bad status from Active Endpoints Request: " + result.status);
//		}
//		cb(err, result);
}

ZDO.prototype._handleManagementLqiResponse = function(packet, cb) {
	console.log("got Management Lqi Response");
}

ZDO.prototype._handleManagementRtgResponse = function(packet, cb) {
	console.log("got Management Rtg Response");
}

ZDO.prototype._handleManagementLeaveResponse = function(packet, cb) {
	console.log("got Management Leave Response");
}

ZDO.prototype._handleManagementPermitJoinResponse = function(packet, cb) {
	console.log("got Management Permit Join Response");
}

ZDO.prototype._handleManagementNetworkUpdate = function(packet, cb) {
	console.log("got Management Network Update");
}

ZDO.prototype._handleBindResponse = function(packet, cb) {
	var response = {
			status : packet.rawData[1]
	};
	if (response.status != 0x00) {
		// TODO map statis to text
		err = new Error("Binding status: " + response.status);
	}
	console.log("got bind response: " + util.inspect(response));
	if (typeof cb != 'undefined') {
		cb(null, response);
	}
}

/**
 * Send an EndDevice Announce to the Coordinator
 * [ Sequence Number] + [16-bit address] + [64-bit address] + [Capability]
 */
ZDO.prototype.deviceAnnounce = function(packet) {
	// TODO implement sending outward announce message
}


/**
 * Request type for Network Address Request
 */
var RequestType = exports.RequestType = {
	SingleDeviceResponse: 0x00,
	ExtendedResponse: 0x01
}


