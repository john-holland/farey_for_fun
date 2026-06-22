package com.fareyfs.repository;

import com.fareyfs.model.FileContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FileContentRepository extends JpaRepository<FileContent, Long> {
    FileContent findByNodeId(Long nodeId);
    
    List<FileContent> findByContentType(String contentType);
    
    @Query("SELECT fc FROM FileContent fc WHERE fc.contentHash = :hash")
    List<FileContent> findByContentHash(@Param("hash") String hash);
    
    @Query("SELECT fc FROM FileContent fc WHERE fc.node.nodeType = 'FILE'")
    List<FileContent> findAllFileContents();
    
    @Query("SELECT fc FROM FileContent fc WHERE fc.contentType LIKE %:type%")
    List<FileContent> findByContentTypeContaining(@Param("type") String type);
} 