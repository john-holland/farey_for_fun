-- Create nodes table
CREATE TABLE nodes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    node_type VARCHAR(20) NOT NULL,
    left_denominator BIGINT,
    right_denominator BIGINT,
    prime_log_encoding VARCHAR(255),
    permissions VARCHAR(9),
    owner VARCHAR(50),
    group_name VARCHAR(50),
    parent_id BIGINT,
    version BIGINT,
    FOREIGN KEY (parent_id) REFERENCES nodes(id)
);

-- Create file_contents table
CREATE TABLE file_contents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content LONGBLOB,
    content_type VARCHAR(100),
    file_size BIGINT,
    node_id BIGINT UNIQUE,
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);

-- Create indexes
CREATE INDEX idx_node_name ON nodes(name);
CREATE INDEX idx_node_type ON nodes(node_type);
CREATE INDEX idx_node_farey ON nodes(left_denominator, right_denominator);
CREATE INDEX idx_node_prime_log ON nodes(prime_log_encoding);
CREATE INDEX idx_node_parent ON nodes(parent_id);

-- Insert root node
INSERT INTO nodes (name, node_type, permissions, owner, group_name, version)
VALUES ('root', 'ROOT', 'rwxr-xr-x', 'root', 'root', 0); 