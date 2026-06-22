package com.fareyfs.sql_service.service;

import com.fareyfs.sql_service.entity.FileContent;
import com.fareyfs.sql_service.repository.FileContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FileContentService {
    @Autowired
    private FileContentRepository fileContentRepository;

    public FileContent saveContent(FileContent content) {
        return fileContentRepository.save(content);
    }

    public FileContent getContent(Long nodeId) {
        return fileContentRepository.findByNodeId(nodeId);
    }

    public void deleteContent(Long nodeId) {
        FileContent content = fileContentRepository.findByNodeId(nodeId);
        if (content != null) {
            fileContentRepository.delete(content);
        }
    }
} 