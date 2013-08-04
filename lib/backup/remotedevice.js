/*

public interface RemoteDevice {
   
    /**
     * This is mandatory and should not be null.
     * @return
     /
    public NetworkAddress getNetworkAddress();
   
    /**
     * Get 64bit IEEE address of this ZigBee node.
     * @return
     * @throws ZDONotRetrievedException
     /
    public IEEEAddress getIEEEAddress() throws IOException;

    /**
     * Get NodeDescriptor of this ZigBee node.
     * Descriptor must be retrieved via ZDP commands before get.
     * @return NodeDescriptor
     * @throws ZDONotRetrievedException if the descriptor not retrieved yet.
     /
    public ZigBeeNodeDescriptor getNodeDescriptor() throws IOException;

    /**
     * Get NodePowerDescriptor of this ZigBee node.
     * <p>
     * Descriptor must be retrieved via ZDP commands before get.
     * @return NodePowerDescriptor
     * @throws ZDONotRetrievedException if the descriptor not retrieved yet.
     /
    public ZigBeeNodePowerDescriptor getNodePowerDescriptor() throws IOException;
   
    /**
     * Get active endpoint count for this ZigBee node.
     * <p>
     * Active endpoint count must be retrieved via ZDP commands before get.
     * @return Active endpoint count
     * @throws ZDONotRetrievedException if the active endpoint count not retrieved yet.
     /
    public int getActiveEndpointCount() throws IOException;
   
    /**
     * Get active endpoint count actually retrieved for this ZigBee node.
     * <p>
     * Extended_Active_EP_req may be required to retrieve full endpoints.
     * @return Actual active endpoint count, 0 if any endpoint are not retrieved yet.
     /
    public int getActualActiveEndpointCount();
   
    /**
     * Get specific active endpoint.
     * <p>
     * Extended_Active_EP_req may be required to get specific endpoint.
     * @param endpoint specific endpoint number
     * @return null if the endpoint not found.
     * @throws ZDONotRetrievedException if any endpoint are not retrieved yet.
     /
    public Endpoint getActiveEndpoint(byte endpoint) throws IOException;
   
    /**
     * Get all active endpoint list.
     * <p>
     * Extended_Active_EP_req may be required to get full endpoints.
     * @param startIndex
     * @return
     * @throws ZDONotRetrievedException
     /
    public List getActiveEndpoints(int startIndex) throws IOException;
   
    /**
     * Get ComplexDescriptor of this ZigBee node.
     * <p>
     * Descriptor must be retrieved via ZDP commands before get.
     * @return null if ComplexDescriptor is not supported by this ZigBee node.
     * @throws ZDONotRetrievedException if the NodeDescriptor or ComplexDescriptor not retrieved yet.
     /
    public Object getComplexDescriptor() throws IOException;
   
    /
     * Get UserDescriptor of this ZigBee node.
     * <p>
     * Descriptor must be retrieved via ZDP commands before get.
     * @return null if UserDescriptor is not supported by this ZigBee node.
     * @throws ZDONotRetrievedException if the descriptor not retrieved yet.
     /
    public String getUserDescriptor() throws IOException;
   
    /
     * Set UserDescriptor for this ZigBee node. Need User_Desc_set to apply set.
     * @param userDesc UserDescriptor to set.
     * @throws ZDONotRetrievedException if the NodeDescriptor not retrieved yet.
     * @throws ZigBeeException if the UserDescriptor not supported by this ZigBee node.
     /
    public void setUserDescriptor(String userDesc) throws IOException;
   
    public static interface Endpoint {
       
        public byte getEndpoint();
       
        public ZigBeeSimpleDescriptor getSimpleDescriptor();
    }
}

*/