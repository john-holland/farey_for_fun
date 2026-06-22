package com.fareyfs.controller;

import com.fareyfs.model.FareyNode;
import com.fareyfs.model.FileContent;
import com.fareyfs.service.FileSystemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/filesystem")
public class FileSystemController {
    @Autowired
    private FileSystemService fileSystemService;

    @PostMapping("/nodes")
    public ResponseEntity<FareyNode> createNode(
            @RequestParam String name,
            @RequestParam FareyNode.NodeType type,
            @RequestParam(required = false) Long parentId) {
        return ResponseEntity.ok(fileSystemService.createNode(name, type, parentId));
    }

    @PutMapping("/nodes/{id}")
    public ResponseEntity<FareyNode> updateNode(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam FareyNode.NodeType type) {
        return ResponseEntity.ok(fileSystemService.updateNode(id, name, type));
    }

    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        fileSystemService.deleteNode(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/nodes/{id}")
    public ResponseEntity<FareyNode> getNode(@PathVariable Long id) {
        return fileSystemService.getNode(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/nodes/{id}/children")
    public ResponseEntity<List<FareyNode>> getChildren(@PathVariable Long id) {
        return ResponseEntity.ok(fileSystemService.getChildren(id));
    }

    @PostMapping("/files")
    public ResponseEntity<FareyNode> createFile(
            @RequestParam String name,
            @RequestParam MultipartFile file,
            @RequestParam Long parentId) {
        try {
            Path tempFile = Files.createTempFile("upload-", file.getOriginalFilename());
            file.transferTo(tempFile);
            FareyNode fileNode = fileSystemService.createFile(name, tempFile, parentId);
            Files.delete(tempFile);
            return ResponseEntity.ok(fileNode);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/files/{id}/content")
    public ResponseEntity<FileContent> getFileContent(@PathVariable Long id) {
        FileContent content = fileSystemService.getFileContent(id);
        return content != null ? ResponseEntity.ok(content) : ResponseEntity.notFound().build();
    }

    @PutMapping("/files/{id}/content")
    public ResponseEntity<Void> updateFileContent(
            @PathVariable Long id,
            @RequestParam MultipartFile file) {
        try {
            byte[] content = file.getBytes();
            fileSystemService.updateFileContent(id, content, file.getContentType());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        fileSystemService.deleteFile(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search/name")
    public ResponseEntity<List<FareyNode>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(fileSystemService.searchByName(name));
    }

    @GetMapping("/search/type")
    public ResponseEntity<List<FareyNode>> searchByType(@RequestParam FareyNode.NodeType type) {
        return ResponseEntity.ok(fileSystemService.searchByType(type));
    }

    @GetMapping("/search/farey")
    public ResponseEntity<List<FareyNode>> searchByFareyFraction(
            @RequestParam Long left,
            @RequestParam Long right) {
        return ResponseEntity.ok(fileSystemService.searchByFareyFraction(left, right));
    }

    @GetMapping("/search/prime-log")
    public ResponseEntity<List<FareyNode>> searchByPrimeLogEncoding(@RequestParam String encoding) {
        return ResponseEntity.ok(fileSystemService.searchByPrimeLogEncoding(encoding));
    }

    @GetMapping("/root")
    public ResponseEntity<FareyNode> getRootNode() {
        return ResponseEntity.ok(fileSystemService.getRootNode());
    }

    @GetMapping("/ip/{ipAddress}")
    public ResponseEntity<FareyNode> getIpNode(@PathVariable String ipAddress) {
        FareyNode node = fileSystemService.getIpNode(ipAddress);
        return node != null ? ResponseEntity.ok(node) : ResponseEntity.notFound().build();
    }

    @GetMapping("/computer/{computerName}")
    public ResponseEntity<FareyNode> getComputerNode(@PathVariable String computerName) {
        FareyNode node = fileSystemService.getComputerNode(computerName);
        return node != null ? ResponseEntity.ok(node) : ResponseEntity.notFound().build();
    }

    @GetMapping("/path")
    public ResponseEntity<List<FareyNode>> getPathNodes(@RequestParam String path) {
        try {
            return ResponseEntity.ok(fileSystemService.getPathNodes(path));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/rebalance")
    public ResponseEntity<Void> rebalanceTree() {
        fileSystemService.rebalanceTree();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/update-farey-fractions")
    public ResponseEntity<Void> updateFareyFractions() {
        fileSystemService.updateFareyFractions();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/update-prime-log-encodings")
    public ResponseEntity<Void> updatePrimeLogEncodings() {
        fileSystemService.updatePrimeLogEncodings();
        return ResponseEntity.ok().build();
    }
} 