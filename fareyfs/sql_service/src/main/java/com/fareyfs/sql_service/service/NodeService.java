package com.fareyfs.sql_service.service;

import com.fareyfs.sql_service.entity.Node;
import com.fareyfs.sql_service.entity.NodeType;
import com.fareyfs.sql_service.repository.NodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class NodeService {
    @Autowired
    private NodeRepository nodeRepository;

    public Node createNode(Node node) {
        return nodeRepository.save(node);
    }

    public Node updateNode(Node node) {
        return nodeRepository.save(node);
    }

    public void deleteNode(Long id) {
        nodeRepository.deleteById(id);
    }

    public Node getNode(Long id) {
        return nodeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Node not found"));
    }

    public List<Node> getChildren(Long parentId) {
        return nodeRepository.findByParentId(parentId);
    }

    public Node getRoot() {
        return nodeRepository.findRoot();
    }

    public List<Node> searchByName(String name) {
        return nodeRepository.findByNameContaining(name);
    }

    public List<Node> searchByType(NodeType type) {
        return nodeRepository.findByNodeType(type);
    }

    public List<Node> searchByFareyFraction(Long left, Long right) {
        return nodeRepository.findByFareyFraction(left, right);
    }

    public List<Node> searchByPrimeLogEncoding(String encoding) {
        return nodeRepository.findByPrimeLogEncoding(encoding);
    }
} 