package com.fareyfs.service.impl;

import com.fareyfs.model.FareyNode;
import com.fareyfs.model.FileContent;
import com.fareyfs.repository.FareyNodeRepository;
import com.fareyfs.repository.FileContentRepository;
import com.fareyfs.service.FileSystemService;
import com.fareyfs.util.FareyTree;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.math.BigInteger;

@Service
@Transactional
public class FileSystemServiceImpl implements FileSystemService {
    @Autowired
    private FareyNodeRepository nodeRepository;
    
    @Autowired
    private FileContentRepository contentRepository;
    
    @Autowired
    private FareyTree fareyTree;

    @Override
    public FareyNode createNode(String name, FareyNode.NodeType type, Long parentId) {
        FareyNode parent = parentId != null ? 
            nodeRepository.findById(parentId).orElseThrow(() -> 
                new RuntimeException("Parent node not found")) : null;
            
        FareyNode node = new FareyNode();
        node.setName(name);
        node.setNodeType(type);
        node.setParent(parent);
        
        // Calculate Farey fraction
        BigInteger[] fraction = fareyTree.calculateFareyFraction(parent);
        node.setLeftDenominator(fraction[0]);
        node.setRightDenominator(fraction[1]);
        
        // Calculate prime log encoding
        node.setPrimeLogEncoding(fareyTree.calculatePrimeLogEncoding(fraction[0], fraction[1]));
        
        return nodeRepository.save(node);
    }

    @Override
    public FareyNode updateNode(Long id, String name, FareyNode.NodeType type) {
        FareyNode node = nodeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Node not found"));
            
        node.setName(name);
        node.setNodeType(type);
        return nodeRepository.save(node);
    }

    @Override
    public void deleteNode(Long id) {
        FareyNode node = nodeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Node not found"));
            
        if (node.getFileContent() != null) {
            contentRepository.delete(node.getFileContent());
        }
        
        nodeRepository.delete(node);
    }

    @Override
    public Optional<FareyNode> getNode(Long id) {
        return nodeRepository.findById(id);
    }

    @Override
    public List<FareyNode> getChildren(Long parentId) {
        return nodeRepository.findByParentId(parentId);
    }

    @Override
    public FareyNode createFile(String name, Path filePath, Long parentId) {
        try {
            byte[] content = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            
            FareyNode fileNode = createNode(name, FareyNode.NodeType.FILE, parentId);
            
            FileContent fileContent = new FileContent();
            fileContent.setNode(fileNode);
            fileContent.setContent(content);
            fileContent.setContentType(contentType);
            fileContent.setContentHash(calculateContentHash(content));
            
            fileNode.setFileContent(fileContent);
            return nodeRepository.save(fileNode);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create file", e);
        }
    }

    @Override
    public FileContent getFileContent(Long nodeId) {
        return contentRepository.findByNodeId(nodeId);
    }

    @Override
    public void updateFileContent(Long nodeId, byte[] content, String contentType) {
        FileContent fileContent = contentRepository.findByNodeId(nodeId);
        if (fileContent == null) {
            throw new RuntimeException("File content not found");
        }
        
        fileContent.setContent(content);
        fileContent.setContentType(contentType);
        fileContent.setContentHash(calculateContentHash(content));
        contentRepository.save(fileContent);
    }

    @Override
    public void deleteFile(Long nodeId) {
        deleteNode(nodeId);
    }

    @Override
    public List<FareyNode> searchByName(String name) {
        return nodeRepository.findByNameContaining(name);
    }

    @Override
    public List<FareyNode> searchByType(FareyNode.NodeType type) {
        return nodeRepository.findByNodeType(type);
    }

    @Override
    public List<FareyNode> searchByFareyFraction(Long left, Long right) {
        return nodeRepository.findByFareyFraction(BigInteger.valueOf(left), BigInteger.valueOf(right));
    }

    @Override
    public List<FareyNode> searchByPrimeLogEncoding(String encoding) {
        return nodeRepository.findByPrimeLogEncoding(encoding);
    }

    @Override
    public FareyNode getRootNode() {
        return nodeRepository.findRootNode();
    }

    @Override
    public FareyNode getIpNode(String ipAddress) {
        return nodeRepository.findByIpAddress(ipAddress);
    }

    @Override
    public FareyNode getComputerNode(String computerName) {
        return nodeRepository.findByComputerName(computerName);
    }

    @Override
    public List<FareyNode> getPathNodes(String path) {
        String[] parts = path.split("/");
        List<FareyNode> nodes = new ArrayList<>();
        FareyNode current = getRootNode();
        
        for (String part : parts) {
            if (part.isEmpty()) continue;
            
            current = nodeRepository.findByParentIdAndName(current.getId(), part)
                .orElseThrow(() -> new RuntimeException("Path not found: " + path));
            nodes.add(current);
        }
        
        return nodes;
    }

    @Override
    public void rebalanceTree() {
        // Implementation for tree rebalancing
        // This would involve recalculating Farey fractions and updating the tree structure
    }

    @Override
    public void updateFareyFractions() {
        // Implementation for updating Farey fractions
        // This would involve recalculating all Farey fractions in the tree
    }

    @Override
    public void updatePrimeLogEncodings() {
        // Implementation for updating prime log encodings
        // This would involve recalculating all prime log encodings in the tree
    }

    private String calculateContentHash(byte[] content) {
        // Implementation for calculating content hash
        // This could use SHA-256 or another hashing algorithm
        return UUID.randomUUID().toString(); // Placeholder
    }
} 