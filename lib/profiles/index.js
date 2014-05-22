var ZDP = require("./zdp");
var HA = require("./ha");

var Profiles = exports.Profiles = {
		0x0000: ZDP,
		0x0104: HA,
}

exports.getDeviceName = function(profileId, deviceId) {
    var deviceName = Profiles[profileId] ? Profiles[profileId].DeviceNames[deviceId] : "Unknown device";
    return deviceName;
};

exports.getClusterName = function(profileId, clusterId) {
    var clusterName = Profiles[profileId] ? Profiles[profileId].ClusterNames[clusterId] : "Unknown cluster";
    return clusterName;
};

exports.getCluster = function(profileId, clusterId, device, direction) {
    var cluster = Profiles[profileId] ? Profiles[profileId].Clusters[clusterId] : null;
    if (!cluster) {
    	return null;
    }
    return new cluster(device, direction);
};