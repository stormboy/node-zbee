/*
public interface NetworkManager {
    
    public void permitJoin(int pj) throws IOException
    
    public List energyScan(int scanChannels, int scanDuration) throws IOException;
    
    public List networkDiscovery(int scanChannels, int scanDuration) throws IOException;
    
    public void formNetwork(long extPanId, int scanChannels, int scanDuration) throws IOException;
    
    public void leaveNetwork() throws IOException;
    
    public NetworkAddress getNetworkAddress() throws IOException;
}
*/

//  public void updateAddressMap(IEEEAddress address64, NetworkAddress address16, boolean sleepyAnnounce) {

//  public NetworkAddress lookupNodeIdByEui64(IEEEAddress address64) {

// public IEEEAddress lookupEui64ByNodeId(NetworkAddress address16) {

var NetworkManager = function(xbee) {
	this.xbee = xbee;
	this.addressMap = {};
}

// functions

NetworkManager.prototype.permitJoin = function(pj) {
        if (pj < 0 || 0xFF < pj) {
            throw new IOException("Out of range");
        }
        xbIO.write8("NJ", pj);
        xbIO.write8("CB", (byte) 2);
}

NetworkManager.prototype.energyScan = function(scanChannels, scanDuration) {
        throw new UnsupportedOperationException("Not supported on XBee.");
}

NetworkManager.prototype.networkDiscovery = function(scanChannels, scanDuration) {
        throw new UnsupportedOperationException("Not supported on XBee.");
}

NetworkManager.prototype.formNetwork = function(extPanId, scanChannels, scanDuration) {
        throw new UnsupportedOperationException("Not supported on XBee.");
}

NetworkManager.prototype.leaveNetwork = function() {
        throw new UnsupportedOperationException("Not supported on XBee.");
}
    
NetworkManager.prototype.getIEEEAddress = function() {
        if (ieeeAddress == null) {
            try {
                int[] addr64 = new int[2];
                addr64[0] = xbIO.read32("SH");
                addr64[1] = xbIO.read32("SL");
                byte[] ieee = ByteUtil.BIG_ENDIAN.toByteArray(addr64, ByteUtil.INT_32_SIZE, 2);
                ieeeAddress = IEEEAddress.getByAddress(ieee);
            } catch (IOException ex) {
                throw new IllegalAccessError("Can't Read PhysicalAddress." + ex);
            }
        }
        return ieeeAddress;
}

NetworkManager.prototype.getNetworkAddress = function() {
        int my = xbIO.read16("MY");
        return NetworkAddress.getByAddress(ByteUtil.BIG_ENDIAN.toByteArray(my, ByteUtil.INT_16_SIZE));
    }
    
NetworkManager.prototype.getCurrentChannel = function() {
        return xbIO.read8("CH");
}

NetworkManager.prototype.getCurrentExtendedPANID = function() {
	return xbIO.read64("OP");
}

NetworkManager.prototype.getCurrentPANID = function() {
    return xbIO.read16("OI");
}

NetworkManager.prototype.getNodeType = function() {
    int vr = xbIO.read16("VR");
    int type = (vr & XBeeAPI.VR_TYPE_MASK);
    switch (type) {
    case XBeeAPI.VR_COORDINATOR:
        return TYPE_COORDINATOR;
    case XBeeAPI.VR_ROUTER:
        return TYPE_ROUTER;
    case XBeeAPI.VR_END_DEVICE:
        return TYPE_END_DEVICE;
    default:
        return TYPE_UNKNOWN;
    }
}



    
NetworkManager.prototype.updateAddressMap = function(IEEEAddress address64, NetworkAddress address16, boolean sleepyAnnounce) {
        synchronized (addressLock) {
            addressMap.put(address64, address16);
        }
    }

NetworkManager.prototype.lookupNodeIdByEui64 = function(IEEEAddress address64) {
        synchronized (addressLock) {
            Object o = addressMap.get(address64);
            if (o != null) {
                return (NetworkAddress) o;
            }
        }
        return null;
    }

NetworkManager.prototype.lookupEui64ByNodeId = function(NetworkAddress address16) {
        synchronized (addressLock) {
            Set entrySet = addressMap.entrySet();
            for (Iterator it = entrySet.iterator(); it.hasNext();) {
                Map.Entry entry = (Map.Entry) it.next();
                if (entry.getValue().equals(address16)) {
                    return (IEEEAddress) entry.getKey();
                }
            }
        }
        return null;
    }