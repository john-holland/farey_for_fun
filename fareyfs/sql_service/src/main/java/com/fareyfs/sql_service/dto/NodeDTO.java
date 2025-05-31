package com.fareyfs.sql_service.dto;

import com.fareyfs.sql_service.entity.NodeType;
import lombok.Data;

@Data
public class NodeDTO {
    private Long id;
    private String name;
    private NodeType nodeType;
    private Long leftDenominator;
    private Long rightDenominator;
    private String primeLogEncoding;
    private Long parentId;
    private String permissions;
    private String owner;
    private String group;
} 