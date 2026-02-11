# SonarCloud Configuration Guide for Your Project

## Your Repository Information
- **GitHub URL:** https://github.com/FizaShakil/fizashakil-mern-10pshine
- **Owner:** FizaShakil
- **Repository:** fizashakil-mern-10pshine

## Step 1: Create SonarCloud Account & Import Project

### 1.1 Sign Up / Sign In
1. Go to **[SonarCloud.io](https://sonarcloud.io/)**
2. Click **"Log in"** (top right)
3. Choose **"With GitHub"**
4. Authorize SonarCloud to access your GitHub

### 1.2 Import Your Repository
1. After login, click **"+"** button (top right)
2. Select **"Analyze new project"**
3. You'll see a list of your GitHub repositories
4. Find and select: **`fizashakil-mern-10pshine`**
5. Click **"Set Up"**

### 1.3 Choose Analysis Method
1. Select **"With GitHub Actions"** (recommended)
2. SonarCloud will show you:
   - **Organization Key** (example: `fizashakil` or `fizashakil-github`)
   - **Project Key** (example: `FizaShakil_fizashakil-mern-10pshine`)

**IMPORTANT: Copy these values! You'll need them in the next step.**

## Step 2: Update sonar-project.properties

Open the file `sonar-project.properties` in your project root and update these two lines:

### Example Values (Replace with YOUR actual values from SonarCloud):

```properties
# Replace these with YOUR values from SonarCloud
sonar.organization=fizashakil
sonar.projectKey=FizaShakil_fizashakil-mern-10pshine
```

### Where to Find These Values:

**Option A: During Setup**
- When you click "Analyze new project", SonarCloud shows them

**Option B: After Setup**
1. Go to your project in SonarCloud
2. Click **"Information"** (bottom left)
3. You'll see:
   - **Organization Key:** `fizashakil`
   - **Project Key:** `FizaShakil_fizashakil-mern-10pshine`

## Step 3: Get Your SonarCloud Token

1. In SonarCloud, click your profile picture (top right)
2. Go to **"My Account"**
3. Click **"Security"** tab
4. Under "Generate Tokens":
   - Name: `GitHub Actions`
   - Type: `Global Analysis Token` (or `User Token`)
   - Click **"Generate"**
5. **COPY THE TOKEN** - it looks like:
   ```
   squ_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
   ```

## Step 4: Add Token to GitHub Secrets

1. Go to: https://github.com/FizaShakil/fizashakil-mern-10pshine/settings/secrets/actions
2. Click **"New repository secret"**
3. Fill in:
   - **Name:** `SONAR_TOKEN`
   - **Secret:** Paste the token from Step 3
4. Click **"Add secret"**

## Step 5: Verify Configuration

Your `sonar-project.properties` should look like this:

```properties
# SonarCloud Configuration
sonar.organization=fizashakil                              # ← YOUR ORG KEY
sonar.projectKey=FizaShakil_fizashakil-mern-10pshine      # ← YOUR PROJECT KEY
sonar.projectName=MERN Notes App
sonar.projectVersion=1.0

# Source code location
sonar.sources=frontend/src,backend/src
sonar.tests=frontend/src,backend/tests
sonar.test.inclusions=**/__tests__/**,**/*.test.ts,**/*.test.tsx,**/*.test.js

# Exclusions
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/*.config.js,**/*.config.ts,**/public/**,**/prisma/migrations/**

# Coverage reports
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info
sonar.coverage.exclusions=**/__tests__/**,**/*.test.ts,**/*.test.tsx,**/*.test.js,**/__mocks__/**,**/setupTests.ts

# Language settings
sonar.language=js,ts
sonar.sourceEncoding=UTF-8

# TypeScript/JavaScript specific
sonar.typescript.tsconfigPath=frontend/tsconfig.json
```

## Step 6: Test It!

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Add SonarCloud integration"
   git push origin main
   ```

2. Go to **"Actions"** tab in your GitHub repo
3. You should see the workflow running
4. After it completes, check SonarCloud for results!

## Quick Checklist

- [ ] Created SonarCloud account
- [ ] Imported `fizashakil-mern-10pshine` project
- [ ] Copied Organization Key and Project Key
- [ ] Updated `sonar-project.properties` with YOUR keys
- [ ] Generated SonarCloud token
- [ ] Added `SONAR_TOKEN` to GitHub Secrets
- [ ] Pushed code to trigger analysis

## Common Values Format

Your values will likely look like:

```properties
# Most common format:
sonar.organization=fizashakil
sonar.projectKey=FizaShakil_fizashakil-mern-10pshine

# Or possibly:
sonar.organization=fizashakil-github
sonar.projectKey=fizashakil_fizashakil-mern-10pshine
```

**The exact format depends on what SonarCloud shows you during setup!**

## Need Help?

If you see errors, check:
1. Organization and Project keys match exactly (case-sensitive)
2. SONAR_TOKEN is correctly added to GitHub Secrets
3. Token hasn't expired
4. You have admin access to the GitHub repository
