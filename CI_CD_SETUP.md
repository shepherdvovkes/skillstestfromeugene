# CI/CD Setup Documentation

This document describes the GitHub Actions CI/CD pipeline setup for the blockchain wallet connection demo project.

## Overview

The CI/CD pipeline consists of multiple workflows that handle different aspects of the development and deployment process:

1. **Main CI/CD Pipeline** (`ci-cd.yml`) - Comprehensive pipeline for all branches
2. **Pull Request Checks** (`pr-checks.yml`) - Fast validation for PRs
3. **Dependency Updates** (`dependency-update.yml`) - Automated dependency management
4. **Release Management** (`release.yml`) - Automated releases and Docker builds

## Workflow Details

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main`, `develop`, or `feature/*` branches
- Pull requests to `main` or `develop`

**Jobs:**
- **Security Checks**: npm audit for vulnerabilities
- **Code Quality**: ESLint, TypeScript checking, Prettier formatting
- **Testing**: Jest tests with coverage reporting
- **Build**: Production build with artifact upload
- **Docker**: Docker image build and testing
- **Deploy Staging**: Automatic deployment to staging (develop branch)
- **Deploy Production**: Automatic deployment to production (main branch)

### 2. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull requests to `main` or `develop`

**Jobs:**
- **Validate**: Quick validation (lint, type check, tests, build)
- **Security Check**: npm audit for high-severity issues
- **Bundle Size Check**: Ensures build output is reasonable
- **Comment**: Automatically comments PR status

### 3. Dependency Updates (`dependency-update.yml`)

**Triggers:**
- Weekly schedule (Mondays at 9 AM UTC)
- Manual trigger

**Jobs:**
- **Check Dependencies**: Identifies outdated packages
- **Security Scan**: Comprehensive security scanning
- **Create Update Issue**: Automatically creates issues for manual review

### 4. Release Management (`release.yml`)

**Triggers:**
- Push of version tags (e.g., `v1.0.0`)

**Jobs:**
- **Release**: Creates GitHub release with changelog
- **Docker Build**: Builds and pushes Docker images
- **Notify**: Release notification

## Required Secrets

To use the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

### For Vercel Deployment:
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### For Docker Registry:
- `DOCKER_REGISTRY`: Your Docker registry URL (e.g., `ghcr.io/username`)

### For Security Scanning:
- `SNYK_TOKEN`: Snyk API token for security scanning

## Setup Instructions

### 1. Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the required secrets listed above

### 2. Configure Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Link your project: `vercel link`
4. Get your project ID from the `.vercel/project.json` file

### 3. Configure Docker Registry (Optional)

If you want to use Docker registry:

1. Create a personal access token for your registry
2. Add the registry URL to secrets
3. Update the workflow to use your registry

### 4. Configure Snyk (Optional)

1. Sign up for Snyk
2. Get your API token
3. Add it to GitHub secrets

## Environment Configuration

### Staging Environment
- Branch: `develop`
- Auto-deploys on push
- Uses staging environment variables

### Production Environment
- Branch: `main`
- Auto-deploys on push
- Uses production environment variables
- Requires manual approval (if configured)

## Branch Strategy

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Feature development branches
- **`hotfix/*`**: Emergency fixes

## Workflow Optimization

### Caching
- npm dependencies are cached between runs
- Docker layers are cached for faster builds
- Build artifacts are stored for 7 days

### Parallel Execution
- Independent jobs run in parallel
- Dependent jobs wait for prerequisites
- Failed jobs don't block unrelated work

### Resource Management
- Jobs use Ubuntu latest runners
- Node.js 18 is used consistently
- Memory and CPU limits are optimized

## Monitoring and Notifications

### Success Notifications
- GitHub status checks
- PR comments with results
- Release notifications

### Failure Notifications
- Automatic issue creation for dependency updates
- Workflow failure notifications
- Detailed error reporting

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review TypeScript errors

2. **Deployment Failures**
   - Verify Vercel credentials
   - Check environment variables
   - Review build output

3. **Test Failures**
   - Run tests locally first
   - Check test environment setup
   - Review test coverage

### Debugging

1. **Enable Debug Logging**
   - Add `ACTIONS_STEP_DEBUG: true` to repository secrets
   - Check workflow run logs

2. **Local Testing**
   - Use `act` to test workflows locally
   - Install: `brew install act` (macOS)

3. **Manual Triggers**
   - Use `workflow_dispatch` to manually trigger workflows
   - Test specific jobs in isolation

## Best Practices

1. **Keep Workflows Fast**
   - Use caching effectively
   - Run jobs in parallel when possible
   - Optimize dependency installation

2. **Security First**
   - Regular security scans
   - Dependency updates
   - Secret management

3. **Quality Assurance**
   - Automated testing
   - Code quality checks
   - Performance monitoring

4. **Documentation**
   - Keep workflows documented
   - Update setup instructions
   - Maintain troubleshooting guides

## Future Enhancements

1. **Performance Monitoring**
   - Bundle size tracking
   - Performance regression detection
   - Lighthouse CI integration

2. **Advanced Security**
   - SAST/DAST scanning
   - Container scanning
   - Compliance checks

3. **Deployment Strategies**
   - Blue-green deployments
   - Canary releases
   - Rollback automation

4. **Monitoring Integration**
   - Error tracking
   - Performance monitoring
   - User analytics

## Support

For issues with the CI/CD pipeline:

1. Check the workflow run logs
2. Review this documentation
3. Create an issue with detailed error information
4. Contact the development team

---

*Last updated: $(date)*
