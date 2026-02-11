# SonarCloud Integration Setup Guide

This guide will help you integrate your MERN project with SonarCloud for continuous code quality analysis.

## Prerequisites

1. GitHub account (or GitLab/Bitbucket)
2. SonarCloud account (free for public repositories)
3. Node.js and npm installed

## Step 1: SonarCloud Account Setup

1. Go to [SonarCloud.io](https://sonarcloud.io/)
2. Sign in with your GitHub/GitLab/Bitbucket account
3. Click "+" → "Analyze new project"
4. Select your repository
5. Note down your:
   - **Organization Key** (e.g., `your-org-name`)
   - **Project Key** (e.g., `your-org_your-repo`)

## Step 2: Update Configuration Files

### Update `sonar-project.properties`

Replace the placeholder values in the root `sonar-project.properties`:

```properties
sonar.organization=YOUR_ORGANIZATION_KEY
sonar.projectKey=YOUR_PROJECT_KEY
```

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `SONAR_TOKEN`: Get this from SonarCloud (Account → Security → Generate Token)
   - `GITHUB_TOKEN`: Automatically provided by GitHub Actions (no need to add)

## Step 4: Install Dependencies

### Backend
```bash
cd backend
npm install --save-dev c8 chai mocha supertest
```

### Frontend
Already configured with Jest and coverage support.

## Step 5: Run Tests Locally with Coverage

### Backend
```bash
cd backend
npm run test:coverage
```

This generates coverage report at `backend/coverage/lcov.info`

### Frontend
```bash
cd frontend
npm run test:coverage
```

This generates coverage report at `frontend/coverage/lcov.info`

## Step 6: Trigger SonarCloud Analysis

### Option A: Automatic (via GitHub Actions)
- Push code to `main` or `develop` branch
- Or create a Pull Request
- GitHub Actions will automatically run tests and send results to SonarCloud

### Option B: Manual (local)
```bash
# Install SonarScanner
npm install -g sonarqube-scanner

# Run analysis
sonar-scanner \
  -Dsonar.organization=YOUR_ORG \
  -Dsonar.projectKey=YOUR_PROJECT_KEY \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=YOUR_SONAR_TOKEN
```

## Step 7: View Results

1. Go to [SonarCloud.io](https://sonarcloud.io/)
2. Navigate to your project
3. View:
   - Code quality metrics
   - Security vulnerabilities
   - Code smells
   - Test coverage
   - Duplications

## Configuration Details

### Files Added/Modified

1. **`sonar-project.properties`** - Main SonarCloud configuration
2. **`.github/workflows/sonarcloud.yml`** - GitHub Actions workflow
3. **`backend/package.json`** - Added test:coverage script
4. **`frontend/package.json`** - Already has test:coverage script

### Coverage Exclusions

The following are excluded from coverage analysis:
- Test files (`**/__tests__/**`, `**/*.test.*`)
- Mock files (`**/__mocks__/**`)
- Configuration files (`**/*.config.js`, `**/*.config.ts`)
- Build outputs (`**/dist/**`, `**/build/**`, `**/coverage/**`)
- Dependencies (`**/node_modules/**`)
- Database migrations (`**/prisma/migrations/**`)

## Quality Gates

SonarCloud default quality gate requires:
- Coverage > 80%
- Duplications < 3%
- Maintainability Rating = A
- Reliability Rating = A
- Security Rating = A

You can customize these in SonarCloud project settings.

## Troubleshooting

### Issue: Coverage not showing
**Solution:** Ensure lcov.info files are generated in correct paths:
- `backend/coverage/lcov.info`
- `frontend/coverage/lcov.info`

### Issue: Analysis fails
**Solution:** Check:
1. SONAR_TOKEN is correctly set in GitHub Secrets
2. Organization and Project keys match SonarCloud
3. Tests pass locally before pushing

### Issue: Backend tests fail in CI
**Solution:** Ensure all test dependencies are installed:
```bash
cd backend
npm install --save-dev c8 chai mocha supertest
```

## Badge (Optional)

Add SonarCloud badge to your README.md:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=YOUR_PROJECT_KEY&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=YOUR_PROJECT_KEY)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=YOUR_PROJECT_KEY&metric=coverage)](https://sonarcloud.io/summary/new_code?id=YOUR_PROJECT_KEY)
```

## Current Test Coverage

- **Backend:** 58 tests (100% passing)
- **Frontend:** 355 tests (99.7% passing, 1 intentionally skipped)

## Next Steps

1. Set up SonarCloud account
2. Update `sonar-project.properties` with your keys
3. Add `SONAR_TOKEN` to GitHub Secrets
4. Push code to trigger analysis
5. Review and fix any issues found by SonarCloud
