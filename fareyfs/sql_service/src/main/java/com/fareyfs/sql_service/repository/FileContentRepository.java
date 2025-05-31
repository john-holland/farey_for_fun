package com.fareyfs.sql_service.repository;

import com.fareyfs.sql_service.entity.FileContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileContentRepository extends JpaRepository<FileContent, Long> {
    FileContent findByNodeId(Long nodeId);
} 