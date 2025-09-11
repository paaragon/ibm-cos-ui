# IBM COS UI

IBM COS UI is a cross-platform desktop application for managing IBM Cloud Object Storage built with Electron, React, TypeScript, and Tailwind CSS. It provides an intuitive interface for managing COS buckets and objects with secure IAM authentication.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Setup
- Ensure Node.js 18.x or later is installed (verified: Node.js 20.19.5 works)
- Ensure npm 8.x or later is installed (verified: npm 10.8.2 works)

### Bootstrap and Install Dependencies
```bash
npm install
```
- **Timing**: 30 seconds. NEVER CANCEL.
- **Expected output**: Installs 646+ packages with some deprecation warnings (normal)
- **Security notes**: 3 moderate vulnerabilities in dev dependencies are expected (Electron sandbox and esbuild issues)

### Development Workflow
1. **Start development environment**:
   ```bash
   npm run dev:vite
   ```
   - **Timing**: Starts in ~200ms. NEVER CANCEL.
   - **Access**: http://localhost:5173/
   - **Notes**: This starts only the React dev server with hot reload. For full Electron testing, see below.

2. **Alternative: Build and run Electron manually**:
   ```bash
   npm run build:electron && npm run electron
   ```
   - **Limitation**: Electron requires display server (X11/Wayland) - will fail in headless environments
   - **Expected error in CI**: "Missing X server or $DISPLAY" - this is normal

### Building for Production
1. **Build Electron main process**:
   ```bash
   npm run build:electron
   ```
   - **Timing**: 1-2 seconds. NEVER CANCEL.
   - **Output**: Compiles TypeScript to `dist-electron/electron/`

2. **Build React renderer**:
   ```bash
   npm run build:renderer
   ```
   - **Timing**: 2-3 seconds. NEVER CANCEL.
   - **Output**: Vite builds optimized React app to `dist/`

3. **Full build with packaging**:
   ```bash
   npm run build
   ```
   - **Timing**: 20-25 seconds. NEVER CANCEL. Set timeout to 60+ minutes for safety.
   - **Output**: Creates distributable in `dist/` (212MB AppImage on Linux)
   - **Expected error**: "GitHub Personal Access Token is not set" - this is normal outside CI
   - **Success indicators**: AppImage file created, no fatal errors

### Code Quality and Validation
1. **Lint TypeScript code**:
   ```bash
   npm run lint
   ```
   - **Timing**: 1-2 seconds. NEVER CANCEL.
   - **Expected warning**: TypeScript version compatibility warning (safe to ignore)

2. **Auto-fix linting issues**:
   ```bash
   npm run lint:fix
   ```
   - **Timing**: 1-2 seconds. NEVER CANCEL.

3. **Format code with Prettier**:
   ```bash
   npm run format
   ```
   - **Timing**: < 1 second. NEVER CANCEL.

4. **Type check without building**:
   ```bash
   npm run type-check
   ```
   - **Timing**: 2-3 seconds. NEVER CANCEL.

5. **Preview production build**:
   ```bash
   npm run preview
   ```
   - **Timing**: Starts immediately. NEVER CANCEL.
   - **Access**: http://localhost:4173/

## Validation After Changes
Always run these validation steps after making changes:

1. **MANDATORY**: Run all quality checks:
   ```bash
   npm run lint && npm run type-check && npm run format
   ```

2. **MANDATORY**: Test development environment:
   ```bash
   npm run dev:vite
   ```
   - Navigate to http://localhost:5173/
   - Verify application loads with "IBM COS UI" header
   - Test connection modal by clicking "Add new connection" button
   - Verify form fields appear: Connection Name, Endpoint URL, API Key, Service Instance ID

3. **MANDATORY**: Test production build:
   ```bash
   npm run build:electron && npm run build:renderer
   ```

4. **RECOMMENDED**: Test full packaging (if time permits):
   ```bash
   npm run build
   ```
   - **Warning**: This takes 20-25 seconds, only run if you have adequate time

## Application Architecture

### Process Structure
- **Main Process** (`electron/main.ts`): Handles application lifecycle, COS operations, system dialogs
- **Preload Script** (`electron/preload.ts`): Secure IPC bridge between main and renderer
- **Renderer Process** (`src/`): React UI with TypeScript and Tailwind CSS
- **COS Service** (`electron/cos-service.ts`): IBM COS SDK operations

### Key Source Directories
```
src/
├── components/          # React components
│   ├── ConnectionModal.tsx    # New connection form
│   ├── MainContent.tsx       # Main app content area
│   ├── Sidebar.tsx          # Connections sidebar
│   ├── ConfirmModal.tsx     # Confirmation dialogs
│   ├── CreateBucketModal.tsx # Bucket creation
│   └── RenameModal.tsx      # Object renaming
├── hooks/              # Custom React hooks
│   ├── useConnections.ts    # Connection management
│   └── useNotifications.ts  # Toast notifications
├── types/              # TypeScript definitions
│   └── index.ts
├── App.tsx             # Main React component
└── main.tsx            # React entry point

electron/
├── main.ts             # Electron main process
├── preload.ts          # Secure IPC bridge
└── cos-service.ts      # IBM COS operations

shared/
└── types.ts            # Shared type definitions
```

### Build Outputs
- `dist-electron/electron/`: Compiled Electron main process
- `dist/`: Built React application
- `dist/IBM COS UI-*.AppImage`: Linux distributable (after full build)

## Important Configuration Files
- `package.json`: Scripts and dependencies (main entry: `dist-electron/electron/main.js`)
- `vite.config.ts`: Vite bundler configuration for renderer
- `tsconfig.json`: TypeScript config for renderer
- `tsconfig.electron.json`: TypeScript config for main process
- `.eslintrc.cjs`: ESLint configuration
- `tailwind.config.js`: Tailwind CSS configuration

## Known Issues and Limitations

### Expected Warnings/Errors
- **TypeScript version warning**: Safe to ignore during ESLint runs
- **Vite CJS deprecation**: Cosmetic warning, does not affect functionality
- **Module type warning**: PostCSS config parsing warning, does not affect builds
- **Electron sandbox error**: Expected in headless/CI environments without display server
- **GitHub token error**: Expected during electron-builder packaging outside CI
- **Security vulnerabilities**: 3 moderate issues in dev dependencies are known and acceptable

### Development Limitations
- **Electron GUI testing**: Cannot interact with Electron windows in headless environments
- **Full dev mode**: `npm run dev` requires display server for Electron process
- **Packaging**: electron-builder requires GitHub token for release uploads

### Authentication Notes
- Application only supports IBM COS IAM authentication
- HMAC credentials are not currently supported
- Credentials are stored in browser localStorage (renderer process only)
- No disk-based credential storage

## Common Tasks

### Adding New Components
1. Create component file in `src/components/`
2. Follow existing patterns using TypeScript and Tailwind CSS
3. Import in `App.tsx` or parent component
4. Always run `npm run lint && npm run type-check` after changes

### Modifying Electron Main Process
1. Edit files in `electron/` directory
2. Run `npm run build:electron` to compile changes
3. Test with `npm run electron` (if display server available)

### Styling Changes
- Use Tailwind CSS classes (configured in `tailwind.config.js`)
- Global styles in `src/index.css`
- Component-specific styles via Tailwind classes

### Adding Dependencies
1. Install: `npm install package-name`
2. For dev dependencies: `npm install -D package-name`
3. Rebuild: `npm run build:electron && npm run build:renderer`
4. Test: `npm run dev:vite`

## Quick Reference Commands

```bash
# Essential development workflow
npm install                    # 30 seconds
npm run dev:vite              # Start dev server (~200ms)
npm run lint && npm run type-check  # Validate code (~3 seconds)

# Building
npm run build:electron        # Build main process (~1-2 seconds)
npm run build:renderer        # Build React app (~2-3 seconds)
npm run build                 # Full build + packaging (20-25 seconds)

# Code quality
npm run lint:fix              # Auto-fix lint issues (~1-2 seconds)
npm run format                # Format with Prettier (<1 second)
npm run type-check            # TypeScript validation (~2-3 seconds)
```

## Verification Checklist
After making changes, verify:
- [ ] `npm run lint` passes without errors
- [ ] `npm run type-check` passes without errors
- [ ] `npm run build:electron && npm run build:renderer` succeeds
- [ ] `npm run dev:vite` starts and application loads at http://localhost:5173/
- [ ] Application shows "IBM COS UI" header and sidebar
- [ ] "Add new connection" button opens modal with required fields
- [ ] No console errors in browser developer tools