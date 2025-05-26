package com.fareyfs.model;

import com.fareyfs.util.FareyTree.FareyFraction;
import java.util.*;
import java.math.BigInteger;

public class FileSystemNode {
    public enum NodeType {
        ROOT, IP, COMPUTER, DRIVE, DIRECTORY, FILE, CONTENT
    }
    
    private Long id;
    private String name;
    private NodeType nodeType;
    private FareyFraction fareyFraction;
    private String primeLogEncoding;
    private List<BigInteger> factors;
    private List<BigInteger> egyptianFractions;
    private FileSystemNode parent;
    private List<FileSystemNode> children;
    private Map<String, Object> metadata;
    
    public FileSystemNode(String name, NodeType nodeType) {
        this.name = name;
        this.nodeType = nodeType;
        this.children = new ArrayList<>();
        this.metadata = new HashMap<>();
    }
    
    public void setFareyFraction(FareyFraction fraction) {
        this.fareyFraction = fraction;
        this.primeLogEncoding = FareyTree.getPrimeLogEncoding(fraction.primeFactors);
        this.factors = fraction.primeFactors;
        this.egyptianFractions = fraction.egyptianFractions;
    }
    
    public void addChild(FileSystemNode child) {
        child.setParent(this);
        children.add(child);
    }
    
    public void setParent(FileSystemNode parent) {
        this.parent = parent;
    }
    
    public String getPath() {
        if (parent == null) {
            return name;
        }
        return parent.getPath() + "/" + name;
    }
    
    public String getFullPath() {
        if (nodeType == NodeType.ROOT) {
            return "0.0.0.0";
        }
        if (parent == null) {
            return name;
        }
        return parent.getFullPath() + "://" + name;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public NodeType getNodeType() { return nodeType; }
    public void setNodeType(NodeType nodeType) { this.nodeType = nodeType; }
    
    public FareyFraction getFareyFraction() { return fareyFraction; }
    
    public String getPrimeLogEncoding() { return primeLogEncoding; }
    
    public List<BigInteger> getFactors() { return factors; }
    
    public List<BigInteger> getEgyptianFractions() { return egyptianFractions; }
    
    public FileSystemNode getParent() { return parent; }
    
    public List<FileSystemNode> getChildren() { return children; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    @Override
    public String toString() {
        return String.format("%s (%s) [%s]", name, nodeType, fareyFraction);
    }
} 