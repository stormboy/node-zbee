/**
 * Zigbee Device Profile (
 * The ZigBee Device Profile is a management and discovery service layer supported on all ZigBee devices. 
 * Like all other profiles, the ZigBee Device Profile defines a set of clusters that can be used to perform a 
 * variety of advanced network management and device discovery operations. Since the ZigBee Device 
 * Profile is supported to some extent on all ZigBee devices, many ZigBee Device Profile cluster operations 
 * can be performed on a variety of ZigBee devices, regardless of the stack or chipset manufacturer. 
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
 * The ZigBee Device Profile (ZDP) is a profile for ZDO that the application 
 * end points and other ZigBee nodes can access.
 */

// from http://www.jennic.com/files/support_files/JN-RM-2017-ZigBeeDeviceProfileAPI-1v5.pdf

/**
 * format of response for zdpMatchDescRsp:
 Parameter      | Array Pos’n | Type       | Valid Range            | Description 
---------------------------------------------------------------------------------------------------- 
eZdpStatus      | 0           | ZDP_Status | ZDP_SUCCESS_VALID      | Status of Match Descriptor Request 
                                             ZDP_INV_REQUESTTYPE 
                                             ZDP_DEVICE_NOT_FOUND 
                                             ZDP_NO_DESCRIPTOR
u16AddrInterest | 1 to 2      | UINT16     | 16-bit network address | Network address of responding device 
nMatchLength    | 3           | UINT8      | 0x00 to 0xFF           | Number of matched endpoints 
*pMatchList     | 4           | UINT8      |                        | Matched Endpoint List

 */
exports.StatusValue = {
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

exports.ClusterId = {
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


