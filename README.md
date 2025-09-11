# IBM COS UI

A desktop application to manage IBM Cloud Object Storage using Electron, React, TypeScript, and Tailwind CSS.

## Overview

IBM COS UI is a cross-platform desktop application that provides an intuitive interface for managing IBM Cloud Object Storage buckets and objects. Built with modern web technologies wrapped in Electron, it offers a secure and efficient way to interact with your COS instances.

## Architecture

The application follows a secure Electron architecture with three main processes:

### Main Process (`electron/main.ts`)
- Handles the main application window and lifecycle
- Manages all IBM COS operations through the COS service layer
- Provides secure IPC communication with the renderer
- Handles system dialogs (file open/save)

### Preload Script (`electron/preload.ts`)
- Creates a secure bridge between main and renderer processes
- Exposes typed APIs via `contextBridge`
- Ensures no direct Node.js access from renderer

### Renderer Process (`src/`)
- React-based UI with TypeScript
- Styled with Tailwind CSS
- Manages application state and user interactions
- Stores connection data in localStorage only

### Security Features
- **Context Isolation**: Enabled to prevent renderer access to Node.js APIs
- **Node Integration**: Disabled in renderer process
- **Secure IPC**: All communication through typed preload bridge
- **Credential Isolation**: COS credentials never stored in main process

## Features

### Connection Management
- Store multiple COS connections with endpoints, API keys, and instance IDs
- Mark connections as default for quick access
- Secure storage in browser localStorage (renderer only)
- Connection validation and error handling

### Bucket Operations
- List all buckets in a COS instance
- Create new buckets with region selection
- Delete empty buckets (with confirmation)
- Visual bucket browser with creation dates

### Object Operations
- Browse objects with folder-like prefix navigation
- Upload single or multiple files
- Download objects with save dialog
- Rename objects (copy + delete operation)
- Delete objects with confirmation
- Search/filter objects by prefix
- File size formatting and metadata display

### User Interface
- Clean, responsive layout with sidebar and main content areas
- Loading states and progress indicators
- Toast notifications for success/error feedback
- Confirmation dialogs for destructive operations
- Drag-and-drop support for file uploads (UI ready)

## Setup and Development

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/paaragon/ibm-cos-ui.git
cd ibm-cos-ui

# Install dependencies
npm install
```

### Development

```bash
# Start the development environment
# This builds Electron main process and starts the app
npm run dev

# Alternative: Build and run separately
npm run build:electron
npm run electron

# For renderer development with hot reload
npm run dev:vite
```

### Building for Production

```bash
# Build everything and create distributable packages
npm run build

# Build only the renderer (React app)
npm run build:renderer

# Build only the Electron main process
npm run build:electron
```

### Code Quality

```bash
# Lint TypeScript and React code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type check without building
npm run type-check
```

## IBM COS Authentication

### Required Credentials

To connect to IBM Cloud Object Storage, you need:

1. **Endpoint URL**: Your COS service endpoint (e.g., `https://s3.us-south.cloud-object-storage.appdomain.cloud`)
2. **API Key**: IBM Cloud API key with COS access permissions
3. **Service Instance ID**: CRN of your COS service instance

### Finding Your Credentials

1. **API Key**: Create in IBM Cloud Console → Manage → Access (IAM) → API keys
2. **Service Instance ID**: Found in IBM Cloud Console → Resource List → Your COS instance → Service credentials
3. **Endpoint**: Listed in your COS instance dashboard under Endpoints

### Authentication Method

The app uses IAM authentication (`signatureVersion: 'iam'`) which is the recommended method for IBM COS. HMAC credentials are not currently supported but could be added in future versions.

## Security Notes

### Credential Storage
- **Renderer Process**: Connection data stored in localStorage for persistence
- **Main Process**: Never stores or caches credentials - receives them per request
- **No Disk Storage**: Credentials are never written to files or system keychain
- **Memory Only**: COS SDK clients created per operation and not cached

### IPC Security
- All communication between renderer and main uses typed IPC channels
- No direct Node.js API access from renderer process
- Context isolation prevents renderer access to Electron internals
- Preload script provides minimal, controlled API surface

### Network Security
- All COS operations use HTTPS endpoints
- Supports IBM's standard TLS/SSL security
- No credentials transmitted in URLs or logged

## Known Limitations

### Current Scope
- Only supports IAM authentication (no HMAC credentials)
- Bucket region defaults to 'us-standard' if not specified
- No advanced bucket configuration (CORS, lifecycle, policies)
- Single-part uploads only (no multipart for large files)
- No bulk operations (select multiple items)

### Future Enhancements
- Keychain/secure credential storage integration
- Advanced bucket management features
- Multipart upload support for large files
- Bulk operations and batch actions
- CI/CD and automated releases

## Directory Structure

```
ibm-cos-ui/
├── electron/                 # Electron main process
│   ├── main.ts              # Main application entry
│   ├── preload.ts           # Secure IPC bridge
│   └── cos-service.ts       # IBM COS operations
├── src/                     # React renderer process
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # Type definitions
│   └── main.tsx            # Renderer entry point
├── shared/                  # Shared types between processes
│   └── types.ts            # Common interfaces
├── dist/                    # Built renderer (generated)
├── dist-electron/           # Built main process (generated)
└── package.json            # Dependencies and scripts
```

## Contributing

### Development Workflow

1. Make changes to source code
2. Test with `npm run dev`
3. Run linting: `npm run lint`
4. Run type checking: `npm run type-check`
5. Build and test: `npm run build`

### Code Style

- TypeScript with strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Functional React components with hooks
- Tailwind CSS for styling

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
