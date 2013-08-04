var util = require("util");
var api = require("svd-xbee/lib/xbee-api");

var Packet = api.Packet;
var C = api.Constants;


var CreateSourceRoute = function(addresses) {
  this.frameId = 0;			// The Frame ID should always be set to 0.
  this.addresses = addresses || [];
}

util.inherits(CreateSourceRoute, Packet);

/**
 * Returns a JS array of byte values
 * which form an API instruction to transmit RF data to a remote Xbee node.
 * Uses .RFData to build the packet .destination64 and .destination16 are also required.
 */ 
CreateSourceRoute.prototype.getPayload = function() {

  // begin with the frame type and frame ID
  var payload = [C.FRAME_TYPE.CREATE_SOURCE_ROUTE, this.frameId];

  // this.destination64 should be an array of 8 integers. Append it to the payload now.
  for(var i=0; i<8; i++) {
    payload.push(this.destination64[i]);
  }

  // this.destination16 should be an array of 2 integers. Append it to the payload too.
  for(var i=0; i<2; i++) {
    payload.push(this.destination16[i]);
  }

  // broadcastRadius and options default values are set in the constructor
  payload.push(0);
  payload.push(this.addresses.length);
  
  for (var a=0; a<this.addresses.length; a++) {
  	var address = this.addresses[a];
  	for(var i=0; i<2; i++) {
      payload.push(address[i]);
    }
  }

  return payload;
}

exports.CreateSourceRoute = CreateSourceRoute;



var ZigbeeCommandFrame = function(addresses) {
  this.frameId = incrementFrameId();
  this.sourceEndpoint = 0x00;    
  this.destEndpoint = 0x00;
  this.clusterId = 0x0000;
  this.profileId = 0x0000;
  this.broadcastRadius = 0x00;
  this.txOptions = 0x00;
}
util.inherits(ZigbeeCommandFrame, Packet);

/**
 * Returns a JS array of byte values
 * which form an API instruction to transmit RF data to a remote Xbee node.
 * Uses .RFData to build the packet .destination64 and .destination16 are also required.
 */ 
ZigbeeCommandFrame.prototype.getPayload = function() {

  // begin with the frame type and frame ID
  var payload = [C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME, this.frameId];

  // this.destination64 should be an array of 8 integers. Append it to the payload now.
  for(var i=0; i<8; i++) {
    payload.push(this.destination64[i]);
  }

  // this.destination16 should be an array of 2 integers. Append it to the payload too.
  for(var i=0; i<2; i++) {
    payload.push(this.destination16[i]);
  }

  payload.push(this.sourceEndpoint);
  payload.push(this.destEndpoint);
  payload.push((this.clusterId >> 8) & (255));
  payload.push(this.clusterId & (255));
  payload.push((this.profileId >> 8) & (255));
  payload.push(this.profileId & (255));
  payload.push(this.broadcastRadius);
  payload.push(this.txOptions);

  if (this.data) {
    for(var j=0; j<this.data.length; j++) {
      if(Buffer.isBuffer(this.data))
        payload.push(this.data[j]);
      else
        payload.push(this.data.charCodeAt(j));
    }
  }

  //console.log("command frame payload: " + payload);
  
  return payload;
}

exports.ZigbeeCommandFrame = ZigbeeCommandFrame;



var frameId = 0x30;

function incrementFrameId() {
  frameId++;
  frameId %= 255;
  if (frameId == 0) frameId = 1; // 0x00 means: no response expected
  return frameId;
}


