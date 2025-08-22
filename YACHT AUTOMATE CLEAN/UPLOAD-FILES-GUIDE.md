# 📁 How to Upload Your Files and Run Git Commands

## Step 1: Extract Your Downloaded Package

### On Windows:
1. **Right-click** on `yacht-automate-brain-v1.0.tar.gz`
2. **Extract All** or use 7-Zip/WinRAR
3. **Navigate** to the extracted folder
4. **Open Command Prompt** in that folder:
   - Hold **Shift + Right-click** in the folder
   - Select **"Open PowerShell window here"** or **"Open command window here"**

### On Mac:
1. **Double-click** `yacht-automate-brain-v1.0.tar.gz` to extract
2. **Open Terminal**
3. **Navigate** to extracted folder:
   ```bash
   cd ~/Downloads/yacht-automate-brain-v1.0
   # (adjust path to where you extracted it)
   ```

### On Linux:
1. **Extract** the package:
   ```bash
   tar -xzf yacht-automate-brain-v1.0.tar.gz
   cd yacht-automate-brain-v1.0
   ```

## Step 2: Verify Your Files

### Check you have these key files:
```bash
# Run this command to see your files:
ls -la
# or on Windows:
dir
```

### You should see:
- `package.json`
- `src/` folder
- `tsconfig.json`
- `railway.toml`
- `README.md`
- Other project files

## Step 3: Create GitHub Repository

### Go to GitHub:
1. **Visit** github.com/new
2. **Repository name**: `yacht-automate-demo`
3. **Make it Public** (for easier Railway deployment)
4. **Don't check** "Initialize this repository with a README"
5. **Click** "Create repository"

### GitHub will show you commands - IGNORE those, use these instead:

## Step 4: Upload Files with Git Commands

### In your extracted folder terminal, run these exact commands:

```bash
# Initialize git repository
git init

# Add all files to git
git add .

# Create first commit
git commit -m "Initial yacht automation system"

# Add your GitHub repository as remote
# Replace YOUR-USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR-USERNAME/yacht-automate-demo.git

# Push files to GitHub
git push -u origin main
```

### If you get authentication errors:
**Option 1 - Use GitHub Desktop (Easier):**
1. Download GitHub Desktop app
2. Clone your empty repository
3. Copy all extracted files into the cloned folder
4. Commit and push via the app

**Option 2 - Use Personal Access Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with repo permissions
3. Use token as password when prompted

## Step 5: Deploy to Railway

### After files are on GitHub:
1. **Go to** railway.app
2. **Sign in** with GitHub
3. **Click** "New Project"
4. **Select** "Deploy from GitHub repo"
5. **Choose** `yacht-automate-demo`

### Set Environment Variables in Railway:
Go to Variables tab and add:
```
NODE_ENV=production
ADMIN_KEY=demo-yacht-2025-secure
PORT=5000
ALLOWED_DOMAIN=*
```

## Troubleshooting Common Issues

### "git not found" error:
**Windows**: Install Git from git-scm.com
**Mac**: Install Xcode Command Line Tools: `xcode-select --install`
**Linux**: `sudo apt install git` or `sudo yum install git`

### "Permission denied" error:
Try running commands with `sudo` on Mac/Linux, or run Command Prompt as Administrator on Windows

### "fatal: not a git repository":
Make sure you're in the correct extracted folder before running `git init`

### "Authentication failed":
Use GitHub Desktop or create a Personal Access Token as described above

## Alternative: Direct File Upload

### If Git commands don't work:
1. **Create** empty repository on GitHub
2. **Click** "uploading an existing file"
3. **Drag and drop** all your extracted files
4. **Commit** directly on GitHub
5. **Proceed** to Railway deployment

## Quick Test After Deployment

### Once Railway deployment is complete:
```bash
# Test your live demo (replace with your Railway URL)
curl https://your-app-name.up.railway.app/health

# Should return:
{
  "status": "healthy",
  "timestamp": "2025-08-17T...",
  "version": "1.0.0"
}
```

## Your Demo URL Structure:
**Railway gives you a URL like:**
`https://yacht-automate-demo-production.up.railway.app`

**Save this URL - it's your live demo system!**

---

## Need Help?

### If you get stuck:
1. **Check** you're in the right folder (contains package.json)
2. **Verify** Git is installed on your system
3. **Try** GitHub Desktop as an alternative
4. **Use** direct file upload if Git doesn't work

**Once your files are on GitHub and deployed to Railway, you have a live professional demo system ready for customer presentations!**