package com.fareyfs.repository;

import com.fareyfs.model.FareyNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigInteger;
import java.util.List;

public interface FareyNodeRepository extends JpaRepository<FareyNode, Long> {
    List<FareyNode> findByParentId(Long parentId);
    
    List<FareyNode> findByNodeType(FareyNode.NodeType nodeType);
    
    @Query("SELECT n FROM FareyNode n WHERE n.leftDenominator = :left AND n.rightDenominator = :right")
    List<FareyNode> findByFareyFraction(@Param("left") BigInteger left, @Param("right") BigInteger right);
    
    @Query("SELECT n FROM FareyNode n WHERE n.primeLogEncoding LIKE %:encoding%")
    List<FareyNode> findByPrimeLogEncoding(@Param("encoding") String encoding);
    
    @Query("SELECT n FROM FareyNode n WHERE n.name LIKE %:name%")
    List<FareyNode> findByNameContaining(@Param("name") String name);
    
    @Query("SELECT n FROM FareyNode n WHERE n.parent IS NULL")
    FareyNode findRootNode();
    
    @Query("SELECT n FROM FareyNode n WHERE n.nodeType = 'IP' AND n.name = :ipAddress")
    FareyNode findByIpAddress(@Param("ipAddress") String ipAddress);
    
    @Query("SELECT n FROM FareyNode n WHERE n.nodeType = 'COMPUTER' AND n.name = :computerName")
    FareyNode findByComputerName(@Param("computerName") String computerName);
} 