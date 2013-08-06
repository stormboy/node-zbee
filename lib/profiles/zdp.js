
var StatusValues = exports.StatusValues = {
	ZDP_SUCCESS_VALID    : 0x00,
	ZDP_INV_REQUESTTYPE  : 0x80,
	ZDP_DEVICE_NOT_FOUND : 0x81,
	ZDP_INV_EP           : 0x82,
	ZDP_NOT_ACTIVE       : 0x83,
	ZDP_NOT_SUPPORTED    : 0x84,
	ZDP_TIMEOUT          : 0x85,
	ZDP_NO_MATCH         : 0x86,
	ZDP_TABLE_FULL       : 0x87,
	ZDP_NO_ENTRY         : 0x88,
	ZDP_NO_DESCRIPTOR    : 0x89,
};

/**
 * ZDP cluster IDs
 */
var ClusterIds = exports.ClusterIds = {
		
	// Requests (sent from client)
	ZDP_NwkAddrReq           : 0x0000,
	ZDP_IeeeAddrReq          : 0x0001,
	ZDP_NodeDescReq          : 0x0002,
	ZDP_PowerDescReq         : 0x0003,
	ZDP_SimpleDescReq        : 0x0004,
	ZDP_ActiveEpReq          : 0x0005,
	ZDP_MatchDescReq         : 0x0006,
	
	ZDP_ComplexDescReq       : 0x0010,
	ZDP_UserDescReq          : 0x0011,
	ZDP_DiscoveryRegisterReq : 0x0012,
	ZDP_EndDeviceAnnce       : 0x0013,
	ZDP_UserDescSet          : 0x0014,

	ZDP_EndDeviceBindReq     : 0x0020,
	ZDP_BindReq              : 0x0021,
	ZDP_UnbindReq            : 0x0022,
	
	ZDP_MgmtNwkDiscReq       : 0x0030,
	ZDP_MgmtLqiReq           : 0x0031,
	ZDP_MgmtRtgReq           : 0x0032,
	ZDP_MgmtBindReq          : 0x0033,
	ZDP_MgmtLeaveReq         : 0x0034,
	ZDP_MgmtDirectJoinReq    : 0x0035,
	
	MgmtPermitJoiningReq     : 0x9999,			// Mandatory server
	MgmtCacheReq             : 0x9999,
	MgmtNwkUpdateReq         : 0x9999,

	// Responses (sent from server)
	ZDP_NwkAddrRsp           : 0x8000,
	ZDP_IeeeAddrRsp          : 0x8001,
	ZDP_NodeDescRsp          : 0x8002,
	ZDP_PowerDescRsp         : 0x8003,
	ZDP_SimpleDescRsp        : 0x8004,
	ZDP_ActiveEpRsp          : 0x8005,
	ZDP_MatchDescRsp         : 0x8006,
	
	ZDP_ComplexDescRsp       : 0x8010,
	ZDP_UserDescRsp          : 0x8011,
	ZDP_DiscoveryRegisterRsp : 0x8012,
	ZDP_EndDeviceAnnceRsp    : 0x8013,
	ZDP_UserDescConf         : 0x8014,

	ZDP_EndDeviceBindRsp     : 0x8020,
	ZDP_BindRsp              : 0x8021,
	ZDP_UnbindRsp            : 0x8022,
	
	ZDP_MgmtNwkDiscRsp       : 0x8030,
	ZDP_MgmtLqiRsp           : 0x8031,
	ZDP_MgmtRtgRsp           : 0x8032,
	ZDP_MgmtBindRsp          : 0x8033,
	ZDP_MgmtLeaveRsp         : 0x8034,
	ZDP_MgmtDirectJoinRsp    : 0x8035,
};




var ClusterNames = exports.ClusterNames = {
//		ZDP_NwkAddrReq           : 0x0000,
//		ZDP_IeeeAddrReq          : 0x0001,
//		ZDP_NodeDescReq          : 0x0002,
//		ZDP_PowerDescReq         : 0x0003,
//		ZDP_SimpleDescReq        : 0x0004,
//		ZDP_ActiveEpReq          : 0x0005,
//		ZDP_MatchDescReq         : 0x0006,
//		
//		ZDP_ComplexDescReq       : 0x0010,
//		ZDP_UserDescReq          : 0x0011,
//		ZDP_DiscoveryRegisterReq : 0x0012,
//		ZDP_EndDeviceAnnce       : 0x0013,
//		ZDP_UserDescSet          : 0x0014,
//
//		ZDP_EndDeviceBindReq     : 0x0020,
//		ZDP_BindReq              : 0x0021,
//		ZDP_UnbindReq            : 0x0022,
//		
//		ZDP_MgmtNwkDiscReq       : 0x0030,
//		ZDP_MgmtLqiReq           : 0x0031,
//		ZDP_MgmtRtgReq           : 0x0032,
//		ZDP_MgmtBindReq          : 0x0033,
//		ZDP_MgmtLeaveReq         : 0x0034,
//		ZDP_MgmtDirectJoinReq    : 0x0035,
//		
//		MgmtPermitJoiningReq     : 0x9999,			// Mandatory server
//		MgmtCacheReq             : 0x9999,
//		MgmtNwkUpdateReq         : 0x9999,
//
//		ZDP_NwkAddrRsp           : 0x8000,
//		ZDP_IeeeAddrRsp          : 0x8001,
//		ZDP_NodeDescRsp          : 0x8002,
//		ZDP_PowerDescRsp         : 0x8003,
//		ZDP_SimpleDescRsp        : 0x8004,
//		ZDP_ActiveEpRsp          : 0x8005,
//		ZDP_MatchDescRsp         : 0x8006,
//		
//		ZDP_ComplexDescRsp       : 0x8010,
//		ZDP_UserDescRsp          : 0x8011,
//		ZDP_DiscoveryRegisterRsp : 0x8012,
//		ZDP_EndDeviceAnnceRsp    : 0x8013,
//		ZDP_UserDescConf         : 0x8014,
//
//		ZDP_EndDeviceBindRsp     : 0x8020,
//		ZDP_BindRsp              : 0x8021,
//		ZDP_UnbindRsp            : 0x8022,
//		
//		ZDP_MgmtNwkDiscRsp       : 0x8030,
//		ZDP_MgmtLqiRsp           : 0x8031,
//		ZDP_MgmtRtgRsp           : 0x8032,
//		ZDP_MgmtBindRsp          : 0x8033,
//		ZDP_MgmtLeaveRsp         : 0x8034,
//		ZDP_MgmtDirectJoinRsp    : 0x8035,
	};