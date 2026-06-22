package com.fareyfs.sql_service.repository;

import com.fareyfs.sql_service.entity.Node;
import com.fareyfs.sql_service.entity.NodeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NodeRepository extends JpaRepository<Node, Long> {
    List<Node> findByParentId(Long parentId);
    
    List<Node> findByNameContaining(String name);
    
    List<Node> findByNodeType(NodeType nodeType);
    
    @Query("SELECT n FROM Node n WHERE n.leftDenominator = :left AND n.rightDenominator = :right")
    List<Node> findByFareyFraction(@Param("left") Long left, @Param("right") Long right);
    
    @Query("SELECT n FROM Node n WHERE n.primeLogEncoding = :encoding")
    List<Node> findByPrimeLogEncoding(@Param("encoding") String encoding);
    
    @Query("SELECT n FROM Node n WHERE n.parent IS NULL")
    Node findRoot();
} 