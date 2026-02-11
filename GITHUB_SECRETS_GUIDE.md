# How to Add SONAR_TOKEN to GitHub Secrets

## Step-by-Step Guide with Screenshots Instructions

### Step 1: Get Your SonarCloud Token

1. Go to **[SonarCloud.io](https://sonarcloud.io/)**
2. Click on your profile picture (top right)
3. Select **"My Account"**
4. Click on **"Security"** tab
5. Under "Generate Tokens":
   - Enter a name: `GitHub Actions Token`
   - Click **"Generate"**
6. **COPY THE TOKEN** (you won't see it again!)
   - Example: `squ_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`

### Step 2: Add Token to GitHub Repository

1. Go to your GitHub repository:
   ```
   https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
   ```

2. Click on **"Settings"** tab (top menu)

3. In the left sidebar, scroll down and click:
   - **"Secrets and variables"**
   - Then click **"Actions"**

4. Click the **"New repository secret"** button (green button)

5. Fill in the form:
   - **Name:** `SONAR_TOKEN` (must be exactly this)
   - **Secret:** Paste the token you copied from SonarCloud
   - Click **"Add secret"**

### Step 3: Verify

You should now see `SONAR_TOKEN` listed under "Repository secrets"

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions - you don't need to add it!

## Visual Guide

```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

Name:   SONAR_TOKEN
Value:  squ_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
        [Add secret]
```

## Troubleshooting

**Q: I can't find the Settings tab**
A: Make sure you have admin access to the repository

**Q: I lost my token**
A: Go back to SonarCloud → My Account → Security → Revoke old token → Generate new one

**Q: Token not working**
A: Make sure:
- Token name is exactly `SONAR_TOKEN` (case-sensitive)
- No extra spaces when pasting
- Token is from the correct SonarCloud organization
