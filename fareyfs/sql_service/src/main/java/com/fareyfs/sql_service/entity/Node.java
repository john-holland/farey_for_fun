package com.fareyfs.sql_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "nodes")
public class Node {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NodeType nodeType;

    @Column(name = "left_denominator")
    private Long leftDenominator;

    @Column(name = "right_denominator")
    private Long rightDenominator;

    @Column(name = "prime_log_encoding")
    private String primeLogEncoding;

    @Column(name = "permissions", length = 9)
    private String permissions;

    @Column(name = "owner")
    private String owner;

    @Column(name = "group_name")
    private String group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Node parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Node> children;

    @OneToOne(mappedBy = "node", cascade = CascadeType.ALL)
    private FileContent content;

    @Version
    private Long version;
} 