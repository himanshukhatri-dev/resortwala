# Git Repository Setup for Deployment

## Problem

The deployment script needs to clone your Git repository on the server, but it's getting authentication errors:
```
fatal: could not read Username for 'https://github.com': No such device or address
```

## Solution: Set Up SSH Deploy Key

### Step 1: Update Repository URL

First, update the repository URL in `deploy_from_git.sh` (line 17) to use SSH format:

```bash
# Change from HTTPS:
REPO_URL="https://github.com/yourusername/resortwala.git"

# To SSH:
REPO_URL="git@github.com:yourusername/resortwala.git"
```

**Replace `yourusername` with your actual GitHub username!**

### Step 2: Generate SSH Key on Server

SSH into your server and generate a deploy key:

```bash
# SSH into server
ssh root@77.37.47.243

# Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "deploy@resortwala" -f ~/.ssh/resortwala_deploy

# Display the public key
cat ~/.ssh/resortwala_deploy.pub
```

Copy the entire output (starts with `ssh-ed25519`).

### Step 3: Add Deploy Key to GitHub

1. Go to your GitHub repository: `https://github.com/yourusername/resortwala`
2. Click **Settings** → **Deploy keys** → **Add deploy key**
3. Title: `ResortWala Server Deploy Key`
4. Key: Paste the public key from Step 2
5. ✅ Check **Allow write access** (optional, only if you need to push from server)
6. Click **Add key**

### Step 4: Configure SSH on Server

Add GitHub to known hosts and configure SSH:

```bash
# Still on the server
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Configure SSH to use the deploy key
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/resortwala_deploy
    StrictHostKeyChecking no
EOF

# Set proper permissions
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/resortwala_deploy
chmod 644 ~/.ssh/resortwala_deploy.pub
```

### Step 5: Test Git Access

Test that the server can clone your repository:

```bash
# Test SSH connection to GitHub
ssh -T git@github.com
# Should output: "Hi username! You've successfully authenticated..."

# Test cloning (replace with your repo URL)
cd /tmp
git clone git@github.com:yourusername/resortwala.git test_clone
# Should clone successfully

# Clean up test
rm -rf test_clone
```

### Step 6: Update deploy_from_git.sh

Edit `deploy_from_git.sh` on your local machine:

```bash
# Line 17 - Update with your actual repository
REPO_URL="git@github.com:HimanshuKhatri/resortwala.git"  # Example
```

### Step 7: Try Deployment Again

Now try deploying:

```powershell
.\deploy_auto.ps1
```

## Alternative: Use HTTPS with Personal Access Token

If you prefer HTTPS over SSH:

### 1. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Select scopes: `repo` (full control)
4. Copy the token (starts with `ghp_`)

### 2. Update Repository URL with Token

Edit `deploy_from_git.sh`:

```bash
# Use token in URL (NOT recommended for security)
REPO_URL="https://ghp_YOUR_TOKEN_HERE@github.com/yourusername/resortwala.git"
```

**⚠️ Warning**: This stores your token in plain text. SSH deploy key is more secure!

## Troubleshooting

### "Permission denied (publickey)"

- Make sure you added the public key to GitHub deploy keys
- Check SSH config: `cat ~/.ssh/config`
- Test connection: `ssh -T git@github.com`

### "Repository not found"

- Verify repository URL is correct
- Make sure deploy key has access to the repository
- Check if repository is private (deploy key needed)

### "Host key verification failed"

```bash
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

## Quick Reference

| Method | Security | Setup Complexity | Recommended |
|--------|----------|------------------|-------------|
| SSH Deploy Key | ✅ High | Medium | ✅ Yes |
| HTTPS + Token | ⚠️ Medium | Low | ❌ No |

## Next Steps

After setting up Git access:

1. Update `REPO_URL` in `deploy_from_git.sh`
2. Run deployment: `.\deploy_auto.ps1`
3. Choose: Beta → master → All Components
4. Verify deployment succeeds

## Summary

```bash
# On server:
ssh-keygen -t ed25519 -C "deploy@resortwala" -f ~/.ssh/resortwala_deploy
cat ~/.ssh/resortwala_deploy.pub  # Copy this

# On GitHub:
# Add as deploy key in repository settings

# On server:
ssh-keyscan github.com >> ~/.ssh/known_hosts
# Configure ~/.ssh/config (see Step 4)

# Test:
ssh -T git@github.com

# On local machine:
# Update REPO_URL in deploy_from_git.sh
.\deploy_auto.ps1
```

Done! Your deployment should now work.
