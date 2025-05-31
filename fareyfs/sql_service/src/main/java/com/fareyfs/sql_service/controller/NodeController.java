package com.fareyfs.sql_service.controller;

import com.fareyfs.sql_service.dto.NodeDTO;
import com.fareyfs.sql_service.entity.Node;
import com.fareyfs.sql_service.entity.NodeType;
import com.fareyfs.sql_service.service.NodeService;
import com.fareyfs.sql_service.service.EgyptianFractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/nodes")
public class NodeController {
    @Autowired
    private NodeService nodeService;
    
    @Autowired
    private EgyptianFractionService egyptianFractionService;

    @PostMapping
    public ResponseEntity<NodeDTO> createNode(@RequestBody NodeDTO nodeDTO) {
        Node node = convertToEntity(nodeDTO);
        Node savedNode = nodeService.createNode(node);
        return ResponseEntity.ok(convertToDTO(savedNode));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NodeDTO> updateNode(@PathVariable Long id, @RequestBody NodeDTO nodeDTO) {
        Node node = convertToEntity(nodeDTO);
        node.setId(id);
        Node updatedNode = nodeService.updateNode(node);
        return ResponseEntity.ok(convertToDTO(updatedNode));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        nodeService.deleteNode(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<NodeDTO> getNode(@PathVariable Long id) {
        Node node = nodeService.getNode(id);
        return ResponseEntity.ok(convertToDTO(node));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<NodeDTO>> getChildren(@PathVariable Long id) {
        List<Node> children = nodeService.getChildren(id);
        List<NodeDTO> childrenDTO = children.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(childrenDTO);
    }

    @GetMapping("/root")
    public ResponseEntity<NodeDTO> getRoot() {
        Node root = nodeService.getRoot();
        return ResponseEntity.ok(convertToDTO(root));
    }

    @GetMapping("/search/name")
    public ResponseEntity<List<NodeDTO>> searchByName(@RequestParam String name) {
        List<Node> nodes = nodeService.searchByName(name);
        List<NodeDTO> nodesDTO = nodes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(nodesDTO);
    }

    @GetMapping("/search/type")
    public ResponseEntity<List<NodeDTO>> searchByType(@RequestParam NodeType type) {
        List<Node> nodes = nodeService.searchByType(type);
        List<NodeDTO> nodesDTO = nodes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(nodesDTO);
    }

    @GetMapping("/search/farey")
    public ResponseEntity<List<NodeDTO>> searchByFareyFraction(
            @RequestParam Long left,
            @RequestParam Long right) {
        List<Node> nodes = nodeService.searchByFareyFraction(left, right);
        List<NodeDTO> nodesDTO = nodes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(nodesDTO);
    }

    @GetMapping("/search/prime-log")
    public ResponseEntity<List<NodeDTO>> searchByPrimeLogEncoding(@RequestParam String encoding) {
        List<Node> nodes = nodeService.searchByPrimeLogEncoding(encoding);
        List<NodeDTO> nodesDTO = nodes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(nodesDTO);
    }

    private Node convertToEntity(NodeDTO dto) {
        Node node = new Node();
        node.setId(dto.getId());
        node.setName(dto.getName());
        node.setNodeType(dto.getNodeType());
        node.setLeftDenominator(dto.getLeftDenominator());
        node.setRightDenominator(dto.getRightDenominator());
        node.setPrimeLogEncoding(dto.getPrimeLogEncoding());
        node.setPermissions(dto.getPermissions());
        node.setOwner(dto.getOwner());
        node.setGroup(dto.getGroup());
        return node;
    }

    private NodeDTO convertToDTO(Node node) {
        NodeDTO dto = new NodeDTO();
        dto.setId(node.getId());
        dto.setName(node.getName());
        dto.setNodeType(node.getNodeType());
        dto.setLeftDenominator(node.getLeftDenominator());
        dto.setRightDenominator(node.getRightDenominator());
        dto.setPrimeLogEncoding(node.getPrimeLogEncoding());
        dto.setPermissions(node.getPermissions());
        dto.setOwner(node.getOwner());
        dto.setGroup(node.getGroup());
        if (node.getParent() != null) {
            dto.setParentId(node.getParent().getId());
        }
        return dto;
    }
} 