# Farey WAN OS

A distributed operating system that uses Farey sequences for file organization and URL-based routing with IPv6 compatibility. The system includes feature toggles, IP management, and both web and desktop interfaces.

## Features

- **FareyFS**: A distributed filesystem using Farey sequences for organization
- **Feature Toggles**: Unleash integration for feature management
- **IP Management**: Whitelist and blacklist management with logging
- **Web Interface**: React-based management dashboard
- **Desktop Client**: Electron-based client for local file management
- **Rancher Integration**: Container orchestration and management

## Prerequisites

- Node.js 18+
- Python 3.8+
- Docker
- Rancher (optional)
- Unleash (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/farey-wan-os.git
cd farey-wan-os
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Development

1. Start the web interface:
```bash
npm run dev:web
```

2. Start the Electron client:
```bash
npm run dev:electron
```

3. Start the backend server:
```bash
python -m uvicorn web.main:app --reload
```

## Building

1. Build the web interface:
```bash
cd web/frontend
npm run build
```

2. Build the Electron app:
```bash
npm run build
```

## Configuration

The system is configured through `config.yaml`. Key sections include:

- `unleash`: Feature toggle configuration
- `rancher`: Container orchestration settings
- `fareyfs`: Filesystem configuration
- `network`: Network settings
- `system_requirements`: Hardware requirements

## Usage

### Web Interface

1. Access the web interface at `http://localhost:8000`
2. Manage feature toggles, IP lists, and files
3. View access logs and system status

### Desktop Client

1. Launch the Electron app
2. Select a directory to add to FareyFS
3. Monitor upload progress
4. View file structure and metadata

### API

The system provides a REST API for integration:

- `GET /features`: List available features
- `POST /features/{name}`: Toggle a feature
- `GET /ip/whitelist`: Get whitelisted IPs
- `POST /ip/whitelist`: Add IP to whitelist
- `GET /files/search`: Search files
- `POST /files`: Add a file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 