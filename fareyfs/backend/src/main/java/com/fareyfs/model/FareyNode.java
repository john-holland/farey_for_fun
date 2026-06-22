package com.fareyfs.model;

import jakarta.persistence.*;
import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "farey_nodes")
public class FareyNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "left_denominator", nullable = false)
    private BigInteger leftDenominator;

    @Column(name = "right_denominator", nullable = false)
    private BigInteger rightDenominator;

    @Column(name = "prime_log_encoding")
    private String primeLogEncoding;

    @Column(columnDefinition = "json")
    private String factors;

    @Column(name = "egyptian_fractions", columnDefinition = "json")
    private String egyptianFractions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private FareyNode parent;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_type", nullable = false)
    private NodeType nodeType;

    @Column(columnDefinition = "json")
    private String metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<FareyNode> children;

    @OneToOne(mappedBy = "node", cascade = CascadeType.ALL)
    private FileContent fileContent;

    public enum NodeType {
        ROOT, IP, COMPUTER, DRIVE, DIRECTORY, FILE, CONTENT
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigInteger getLeftDenominator() { return leftDenominator; }
    public void setLeftDenominator(BigInteger leftDenominator) { this.leftDenominator = leftDenominator; }

    public BigInteger getRightDenominator() { return rightDenominator; }
    public void setRightDenominator(BigInteger rightDenominator) { this.rightDenominator = rightDenominator; }

    public String getPrimeLogEncoding() { return primeLogEncoding; }
    public void setPrimeLogEncoding(String primeLogEncoding) { this.primeLogEncoding = primeLogEncoding; }

    public String getFactors() { return factors; }
    public void setFactors(String factors) { this.factors = factors; }

    public String getEgyptianFractions() { return egyptianFractions; }
    public void setEgyptianFractions(String egyptianFractions) { this.egyptianFractions = egyptianFractions; }

    public FareyNode getParent() { return parent; }
    public void setParent(FareyNode parent) { this.parent = parent; }

    public NodeType getNodeType() { return nodeType; }
    public void setNodeType(NodeType nodeType) { this.nodeType = nodeType; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<FareyNode> getChildren() { return children; }
    public void setChildren(List<FareyNode> children) { this.children = children; }

    public FileContent getFileContent() { return fileContent; }
    public void setFileContent(FileContent fileContent) { this.fileContent = fileContent; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 