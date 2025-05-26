# FareyFS - A Farey Tree-based File System

FareyFS is a novel file system implementation that uses Farey sequences and Egyptian fractions to organize and index files. It provides efficient file searching and organization capabilities through mathematical properties of Farey sequences.

## Features

- File system representation using Farey sequences
- Egyptian fraction-based file indexing
- Prime factorization and log encoding
- Support for multiple file types (JSON, YAML, HTML, TOML, XML, etc.)
- Efficient file searching using Farey tree properties
- ANTLR-based file type detection
- SQL-based storage backend
- RESTful API for file operations
- Modern web frontend

## Project Structure

- `backend/`: Core file system implementation and business logic
- `frontend/`: Web interface for file browsing and searching
- `sql_service/`: Database schema and data access layer
- `parser/`: ANTLR grammar and file type detection

## Building

```bash
mvn clean install
```

## Running

1. Start the SQL service:
```bash
cd sql_service
mvn spring-boot:run
```

2. Start the backend:
```bash
cd backend
mvn spring-boot:run
```

3. Start the frontend:
```bash
cd frontend
mvn spring-boot:run
```

## File System Structure

The file system is organized as a Farey tree with the following hierarchy:

1. Root node (0.0.0.0)
2. IP address nodes
3. Computer name nodes
4. Drive nodes
5. Directory nodes
6. File nodes
7. Content nodes

Each node is assigned a Farey fraction and Egyptian fraction representation, allowing for efficient searching and organization.

## File Type Detection

The system uses ANTLR to detect file types based on:
- File extensions
- Magic bytes
- Content analysis

Supported file types:
- JSON
- YAML
- HTML
- Markdown
- TOML
- XML
- Binary files (images, PDFs, etc.)
- Plain text

## API Documentation

The API documentation is available at `/swagger-ui.html` when running the backend service.

## License

MIT License 