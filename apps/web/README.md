# IP Address Tracker - Frontend

A modern React application built with Vite, TypeScript, and Tailwind CSS that tracks IP addresses and locations using Internet Computer backend services.

## Features

- 🌍 Real-time IP address and geolocation tracking
- 📊 Global visitor statistics
- 🗺️ Static map generation
- 🕒 Recent visits timeline
- ⚡ Fast loading with TanStack Query
- 🎨 Beautiful UI with Tailwind CSS

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **ICP Integration**: @dfinity/agent
- **Linting**: ESLint (Airbnb TypeScript)
- **Formatting**: Prettier

## Development

### Prerequisites

- Node.js 18+
- pnpm
- DFX (Internet Computer SDK)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the local IC replica:
   ```bash
   dfx start --background
   ```

3. Deploy the backend canister:
   ```bash
   dfx deploy ip_address_backend
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

The app will be available at `http://localhost:3000`.

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Type check without emitting

## Building for Production

1. Build the application:
   ```bash
   pnpm build
   ```

2. The built files will be in the `dist/` directory.

3. Deploy to IC:
   ```bash
   dfx deploy --network ic
   ```

## Environment Variables

Create a `.env.local` file with:

```env
VITE_CANISTER_ID_IP_ADDRESS_BACKEND=your_canister_id
VITE_DFX_NETWORK=local
VITE_HOST=http://127.0.0.1:4943
```

## Architecture

### Components

- **CurrentVisitorCard**: Displays current user's IP and location info
- **StatsBoard**: Shows global statistics (total visits, unique countries)
- **RecentList**: Lists recent visitors
- **StaticMap**: Generates and displays location maps

### ICP Integration

- **icpClient.ts**: Handles all ICP canister communications
- Automatic network detection (local/IC)
- Dynamic canister ID resolution
- Proper root key fetching for local development

## Troubleshooting

### Certificate Errors

The application automatically handles certificate issues by:
- Fetching root keys in local development
- Using proper hosts for different networks
- Providing clear error messages

### Canister Connection Issues

1. Ensure the backend canister is deployed
2. Check canister IDs in environment variables
3. Verify network configuration (local vs IC)

## License

MIT
