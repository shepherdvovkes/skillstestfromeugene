# Blockchain Wallet Connection Demo

A production-ready blockchain wallet integration demo built with Next.js, TypeScript, and modern Web3 technologies. This project demonstrates enterprise-grade architecture patterns, comprehensive error handling, and robust wallet management capabilities.

## Overview

This application provides a complete solution for integrating blockchain wallet connections into web applications. It showcases SOLID principles implementation, comprehensive testing strategies, and production-ready deployment configurations.

## Features

### Core Functionality
- Multi-wallet support (MetaMask, WalletConnect, and other Web3 wallets)
- Dynamic network switching (Ethereum, Polygon, BSC, Linea)
- Real-time connection health monitoring
- Comprehensive error handling and recovery
- Persistent wallet connection state management
- Secure HTTPS development and production environments

### Architecture & Design
- SOLID principles implementation with clean architecture
- TypeScript for full type safety and developer experience
- Responsive, accessible UI built with Tailwind CSS
- Comprehensive test suite with Jest and React Testing Library
- Security-first approach with proper data handling
- Service-oriented architecture with dependency injection

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS with custom design system
- **Web3 Integration**: Wagmi + Viem for Ethereum interactions
- **Testing**: Jest + React Testing Library + Testing utilities
- **UI Components**: Custom component library with clsx and tailwind-merge
- **Notifications**: React Hot Toast for user feedback
- **CI/CD**: GitHub Actions with comprehensive workflows

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd blockchain-wallet-connection-demo
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   ```bash
   cp env.example .env.local
   ```

4. Update environment configuration
   ```env
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=1
   NEXT_PUBLIC_SUPPORTED_CHAINS=1,137,56,59144
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

5. Generate SSL certificates (for HTTPS development)
   ```bash
   npm run generate-secrets
   ```

### Development

Start the development server:
```bash
# Standard development server
npm run dev

# HTTPS development server
npm run dev:https
```

The application will be available at:
- HTTP: http://localhost:3000
- HTTPS: https://localhost:3000

### Production Build

Build and start the production server:
```bash
# Build the application
npm run build

# Start production server
npm start

# Start HTTPS production server
npm run start:https
```

## Testing

The project includes a comprehensive testing strategy:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern=wallet
npm test -- --testPathPattern=services
```

### Test Coverage
- Unit tests for individual components and functions
- Integration tests for service interactions
- Error boundary testing for graceful error handling
- Security middleware validation
- UI component testing with user interactions

## Project Structure

```
blockchain-wallet-connection-demo/
├── .github/workflows/          # CI/CD pipeline configurations
├── components/                 # React components
│   ├── status/                # Network status and health components
│   ├── ui/                    # Reusable UI components
│   └── wallet/                # Wallet connection components
├── contexts/                  # React context providers
├── hooks/                     # Custom React hooks
├── middleware/                # Security and request middleware
├── pages/                     # Next.js page components
├── services/                  # Business logic services
│   ├── implementations/       # Service implementations
│   └── interfaces/            # Service contracts
├── strategies/                # Strategy pattern implementations
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions and helpers
├── __tests__/                 # Test files and utilities
├── config/                    # Application configuration
├── scripts/                   # Build and utility scripts
└── styles/                    # Global styles and CSS
```

## Architecture

### SOLID Principles Implementation

The project follows SOLID principles for maintainable and scalable code:

- **Single Responsibility Principle**: Each component and service has a single, well-defined purpose
- **Open/Closed Principle**: Easy extension with new wallet providers and networks
- **Liskov Substitution Principle**: Services can be swapped without breaking functionality
- **Interface Segregation Principle**: Focused interfaces for specific use cases
- **Dependency Inversion Principle**: High-level modules don't depend on low-level modules

### Service Layer Architecture

The application uses a service-oriented architecture with dependency injection:

- **IWalletService**: Abstract wallet operations and state management
- **INetworkService**: Network detection and switching operations
- **IStorageService**: Data persistence and retrieval operations
- **IErrorHandler**: Centralized error handling and reporting

### Strategy Pattern Implementation

Network and wallet strategies provide flexible configuration:

- **NetworkStrategy**: Manages different blockchain networks and their configurations
- **WalletStrategy**: Handles different wallet connection methods and providers

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | Default blockchain network ID | `1` | Yes |
| `NEXT_PUBLIC_SUPPORTED_CHAINS` | Comma-separated supported chain IDs | `1,137,56,59144` | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project identifier | - | Yes |

### Supported Networks

| Network | Chain ID | Description |
|---------|----------|-------------|
| Ethereum Mainnet | 1 | Primary Ethereum network |
| Polygon | 137 | Polygon PoS network |
| BSC | 56 | Binance Smart Chain |
| Linea | 59144 | Linea mainnet |

## Security Features

- Comprehensive error boundaries for graceful error handling
- Input validation and sanitization
- HTTPS support for secure development and production
- Environment variable isolation and validation
- Secure wallet interaction patterns
- XSS protection and security headers

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:https` | Start HTTPS development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run start:https` | Start HTTPS production server |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run generate-secrets` | Generate SSL certificates |

## CI/CD Pipeline

The project includes a comprehensive GitHub Actions CI/CD pipeline:

- **Main Pipeline**: Security checks, quality gates, testing, and deployment
- **PR Validation**: Fast feedback for pull requests
- **Dependency Management**: Automated dependency updates and security scanning
- **Release Management**: Automated releases with Docker builds

For detailed CI/CD documentation, see [CI_CD_SETUP.md](CI_CD_SETUP.md).

## Deployment

### Vercel Deployment
The project is configured for Vercel deployment with:
- Automatic deployments from main and develop branches
- Environment-specific configurations
- SSL certificate management
- Performance optimization

### Docker Deployment
```bash
# Build Docker image
docker build -t blockchain-wallet-demo .

# Run container
docker run -p 3000:3000 blockchain-wallet-demo
```

## Contributing

We welcome contributions to improve this project. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Format your code (`npm run format`)
7. Commit your changes (`git commit -m 'Add your feature'`)
8. Push to the branch (`git push origin feature/your-feature`)
9. Open a Pull Request

### Development Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Use meaningful commit messages
- Follow the established code formatting standards
- Document new features and changes

## Troubleshooting

### Common Issues

**Wallet Connection Problems**
- Ensure MetaMask or other wallet is installed
- Check if the wallet is connected to the correct network
- Verify environment variables are properly configured

**Build Failures**
- Ensure Node.js version is 18.0.0 or higher
- Clear node_modules and reinstall dependencies
- Check TypeScript compilation errors

**Test Failures**
- Ensure all dependencies are installed
- Check test environment configuration
- Verify test utilities are properly imported

### Getting Help

1. Check the existing documentation
2. Review the test files for usage examples
3. Search existing issues for similar problems
4. Create a new issue with detailed information

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Vladimir Ovcharov** - [awe@s0me.uk](mailto:awe@s0me.uk)

## Acknowledgments

- [Wagmi](https://wagmi.sh/) for Web3 React hooks and utilities
- [Viem](https://viem.sh/) for Ethereum TypeScript interface
- [Next.js](https://nextjs.org/) for the React framework and tooling
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Jest](https://jestjs.io/) for testing framework
- [React Testing Library](https://testing-library.com/) for component testing

## Support

For support and questions:
- Review the documentation in this README
- Check the [CI_CD_SETUP.md](CI_CD_SETUP.md) for deployment information
- Examine the test files for usage examples
- Create an issue with detailed problem description

---

**Note**: This is a demonstration project showcasing best practices for blockchain wallet integration. For production use, ensure proper security audits, additional testing, and compliance with relevant regulations.
