# FareyFS - A Farey Tree-based File System

FareyFS is a novel file system implementation that uses Farey sequences and Egyptian fractions for efficient file organization and retrieval. The system provides a modern web interface for browsing, searching, and visualizing files through a mathematical lens.

## Features

### Core File System
- Hierarchical file organization using Farey sequences
- File and directory management with permissions (rwxr-xr-x format)
- Owner and group management
- File content storage with metadata
- Concurrent access control with optimistic locking

### Mathematical Features
- Farey fraction calculations for file positioning
- Egyptian fraction representation with infinite precision
- Prime log encoding for efficient storage
- Tree visualization of the Farey sequence structure

### Search Capabilities
- Search by name (fuzzy matching)
- Search by node type (ROOT, IP, COMPUTER, DRIVE, DIRECTORY, FILE, CONTENT)
- Search by Farey fraction
- Search by prime log encoding

### Web Interface
- Modern, responsive UI using Bootstrap 5
- Interactive file browser
- Advanced search interface
- Tree visualization using D3.js
- Real-time updates

### Database Features
- MySQL database with optimized schema
- Connection pooling with HikariCP
- Database migrations using Flyway
- Indexed queries for fast retrieval
- Transaction management

## Architecture

The system is built using a modular architecture:

- **Frontend**: Spring Boot + Thymeleaf + Bootstrap
- **Backend**: Spring Boot REST API
- **SQL Service**: JPA/Hibernate + MySQL
- **Parser**: ANTLR4 for file type detection

## Setup

### Prerequisites
- Java 17 or higher
- MySQL 8.0 or higher
- Gradle 7.0 or higher

### Database Setup
1. Create a MySQL database:
```sql
CREATE DATABASE fareyfs;
```

2. Configure database connection in `sql_service/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fareyfs
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Building the Project
```bash
# Build all modules
./gradlew build

# Run specific module
./gradlew :frontend:bootRun
./gradlew :backend:bootRun
./gradlew :sql_service:bootRun
```

### Running the Application
1. Start the SQL service:
```bash
./gradlew :sql_service:bootRun
```

2. Start the backend:
```bash
./gradlew :backend:bootRun
```

3. Start the frontend:
```bash
./gradlew :frontend:bootRun
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8081
- SQL Service: http://localhost:8082

## API Endpoints

### Node Management
- `POST /api/nodes` - Create a new node
- `PUT /api/nodes/{id}` - Update a node
- `DELETE /api/nodes/{id}` - Delete a node
- `GET /api/nodes/{id}` - Get node details
- `GET /api/nodes/{id}/children` - Get node children
- `GET /api/nodes/root` - Get root node

### Search Operations
- `GET /api/nodes/search/name?name={query}` - Search by name
- `GET /api/nodes/search/type?type={type}` - Search by type
- `GET /api/nodes/search/farey?left={left}&right={right}` - Search by Farey fraction
- `GET /api/nodes/search/prime-log?encoding={encoding}` - Search by prime log encoding

## Mathematical Background

### Farey Sequences
A Farey sequence of order n is the sequence of completely reduced fractions between 0 and 1, arranged in order of increasing size, with denominators not exceeding n.

### Egyptian Fractions
An Egyptian fraction is a sum of distinct unit fractions, where a unit fraction is a fraction with numerator 1.

### Prime Log Encoding
A compact representation of Egyptian fractions using prime numbers and their logarithms.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 