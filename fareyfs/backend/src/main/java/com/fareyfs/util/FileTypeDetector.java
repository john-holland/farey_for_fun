package com.fareyfs.util;

import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.*;
import com.fareyfs.parser.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;

public class FileTypeDetector {
    private static final Map<String, String> MAGIC_BYTES = new HashMap<>();
    
    static {
        MAGIC_BYTES.put("FFD8FF", "image/jpeg");
        MAGIC_BYTES.put("89504E47", "image/png");
        MAGIC_BYTES.put("25504446", "application/pdf");
        MAGIC_BYTES.put("7B", "application/json");
        MAGIC_BYTES.put("2D2D2D", "application/yaml");
        MAGIC_BYTES.put("3C21444F4354595045", "text/html");
        MAGIC_BYTES.put("3C3F786D6C", "application/xml");
    }
    
    public static String detectFileType(Path filePath) throws IOException {
        // First check file extension
        String extension = getFileExtension(filePath);
        if (extension != null) {
            String mimeType = getMimeTypeFromExtension(extension);
            if (mimeType != null) {
                return mimeType;
            }
        }
        
        // Then check magic bytes
        byte[] header = Files.readAllBytes(filePath);
        String magicBytes = bytesToHex(header, Math.min(header.length, 8));
        String mimeType = MAGIC_BYTES.get(magicBytes);
        if (mimeType != null) {
            return mimeType;
        }
        
        // Finally, try content-based detection
        return detectFromContent(filePath);
    }
    
    private static String detectFromContent(Path filePath) throws IOException {
        String content = new String(Files.readAllBytes(filePath));
        CharStream input = CharStreams.fromString(content);
        FileTypeDetectorLexer lexer = new FileTypeDetectorLexer(input);
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        FileTypeDetectorParser parser = new FileTypeDetectorParser(tokens);
        
        try {
            ParseTree tree = parser.fileType();
            if (tree.getChildCount() > 0) {
                String type = tree.getChild(0).getText();
                return getMimeTypeFromParserType(type);
            }
        } catch (Exception e) {
            // If parsing fails, assume it's text
            return "text/plain";
        }
        
        return "text/plain";
    }
    
    private static String getFileExtension(Path filePath) {
        String fileName = filePath.getFileName().toString();
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(dotIndex + 1) : null;
    }
    
    private static String getMimeTypeFromExtension(String extension) {
        switch (extension.toLowerCase()) {
            case "json": return "application/json";
            case "yaml":
            case "yml": return "application/yaml";
            case "html":
            case "htm": return "text/html";
            case "md": return "text/markdown";
            case "toml": return "application/toml";
            case "xml": return "application/xml";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "png": return "image/png";
            case "pdf": return "application/pdf";
            case "txt": return "text/plain";
            default: return null;
        }
    }
    
    private static String getMimeTypeFromParserType(String parserType) {
        switch (parserType) {
            case "JSON": return "application/json";
            case "YAML": return "application/yaml";
            case "HTML": return "text/html";
            case "MARKDOWN": return "text/markdown";
            case "TOML": return "application/toml";
            case "XML": return "application/xml";
            case "BINARY": return "application/octet-stream";
            case "TEXT": return "text/plain";
            default: return "application/octet-stream";
        }
    }
    
    private static String bytesToHex(byte[] bytes, int length) {
        StringBuilder hex = new StringBuilder();
        for (int i = 0; i < length; i++) {
            hex.append(String.format("%02X", bytes[i]));
        }
        return hex.toString();
    }
} 