-- Create the database
CREATE DATABASE IF NOT EXISTS fareyfs;
USE fareyfs;

-- Create the farey_nodes table
CREATE TABLE IF NOT EXISTS farey_nodes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    left_denominator BIGINT NOT NULL,
    right_denominator BIGINT NOT NULL,
    prime_log_encoding TEXT,
    factors JSON,
    egyptian_fractions JSON,
    parent_id BIGINT,
    node_type ENUM('ROOT', 'IP', 'COMPUTER', 'DRIVE', 'DIRECTORY', 'FILE', 'CONTENT') NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES farey_nodes(id) ON DELETE CASCADE,
    INDEX idx_farey_fraction (left_denominator, right_denominator),
    INDEX idx_node_type (node_type),
    INDEX idx_parent (parent_id)
);

-- Create the file_contents table for storing actual file data
CREATE TABLE IF NOT EXISTS file_contents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    node_id BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    content BLOB,
    content_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES farey_nodes(id) ON DELETE CASCADE,
    INDEX idx_content_type (content_type),
    INDEX idx_content_hash (content_hash)
);

-- Create the file_type_detectors table
CREATE TABLE IF NOT EXISTS file_type_detectors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(50),
    magic_bytes VARCHAR(100),
    parser_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_mime_type (mime_type)
);

-- Create the system_info table
CREATE TABLE IF NOT EXISTS system_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    computer_name VARCHAR(255) NOT NULL,
    ldap_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_ip_computer (ip_address, computer_name)
);

-- Insert some initial file type detectors
INSERT INTO file_type_detectors (mime_type, extension, magic_bytes, parser_type) VALUES
    ('application/json', 'json', '7B', 'JSON'),
    ('application/yaml', 'yaml', '2D2D2D', 'YAML'),
    ('text/html', 'html', '3C21444F4354595045', 'HTML'),
    ('text/markdown', 'md', '2D2D2D', 'MARKDOWN'),
    ('application/toml', 'toml', '23', 'TOML'),
    ('application/xml', 'xml', '3C3F786D6C', 'XML'),
    ('image/jpeg', 'jpg', 'FFD8FF', 'BINARY'),
    ('image/png', 'png', '89504E47', 'BINARY'),
    ('application/pdf', 'pdf', '25504446', 'BINARY'),
    ('text/plain', 'txt', NULL, 'TEXT'); 