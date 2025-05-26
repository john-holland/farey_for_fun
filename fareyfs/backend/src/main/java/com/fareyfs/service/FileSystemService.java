package com.fareyfs.service;

import com.fareyfs.model.FareyNode;
import com.fareyfs.model.FileContent;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

public interface FileSystemService {
    // Node operations
    FareyNode createNode(String name, FareyNode.NodeType type, Long parentId);
    FareyNode updateNode(Long id, String name, FareyNode.NodeType type);
    void deleteNode(Long id);
    Optional<FareyNode> getNode(Long id);
    List<FareyNode> getChildren(Long parentId);
    
    // File operations
    FareyNode createFile(String name, Path filePath, Long parentId);
    FileContent getFileContent(Long nodeId);
    void updateFileContent(Long nodeId, byte[] content, String contentType);
    void deleteFile(Long nodeId);
    
    // Search operations
    List<FareyNode> searchByName(String name);
    List<FareyNode> searchByType(FareyNode.NodeType type);
    List<FareyNode> searchByFareyFraction(Long left, Long right);
    List<FareyNode> searchByPrimeLogEncoding(String encoding);
    
    // Tree operations
    FareyNode getRootNode();
    FareyNode getIpNode(String ipAddress);
    FareyNode getComputerNode(String computerName);
    List<FareyNode> getPathNodes(String path);
    
    // Farey tree operations
    void rebalanceTree();
    void updateFareyFractions();
    void updatePrimeLogEncodings();
} 