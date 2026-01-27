# Quick Fix: Git SSH Setup

## Current Issue
```
Host key verification failed
```

This means the server needs to trust GitHub's SSH key.

## Quick Fix (Run these commands)

### Step 1: SSH into your server
```bash
ssh root@77.37.47.243
```

### Step 2: Add GitHub to known hosts
```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

### Step 3: Test Git connection
```bash
ssh -T git@github.com
```

**Expected output:**
```
Hi himanshukhatri-dev! You've successfully authenticated, but GitHub does not provide shell access.
```

### Step 4: Test cloning your repository
```bash
git clone --depth 1 --branch master git@github.com:himanshukhatri-dev/resortwala.git /tmp/test_clone
```

If successful, clean up:
```bash
rm -rf /tmp/test_clone
```

### Step 5: Exit server and try deployment
```bash
exit  # Exit from server
```

Then on your local machine:
```powershell
.\deploy_auto.ps1
```

---

## Check if Deploy Key Exists

### On GitHub:
1. Go to: https://github.com/himanshukhatri-dev/resortwala/settings/keys
2. Look for any existing deploy keys
3. If you see a key, it's already set up ✅

### On Server:
```bash
ssh root@77.37.47.243 "ls -la ~/.ssh/"
```

Look for files like:
- `id_rsa` / `id_rsa.pub` (old RSA key)
- `id_ed25519` / `id_ed25519.pub` (modern key)
- `resortwala_deploy` / `resortwala_deploy.pub` (custom deploy key)

---

## If No Deploy Key Exists

### Generate new SSH key on server:
```bash
ssh root@77.37.47.243

# Generate key
ssh-keygen -t ed25519 -C "deploy@resortwala" -f ~/.ssh/id_ed25519 -N ""

# Show public key
cat ~/.ssh/id_ed25519.pub
```

### Add to GitHub:
1. Copy the output from `cat ~/.ssh/id_ed25519.pub`
2. Go to: https://github.com/himanshukhatri-dev/resortwala/settings/keys
3. Click **"Add deploy key"**
4. Title: `ResortWala Server`
5. Paste the key
6. Click **"Add key"**

---

## All-in-One Fix Script

Copy and paste this entire block into your terminal:

```bash
ssh root@77.37.47.243 << 'ENDSSH'
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

# Test connection
echo "Testing GitHub connection..."
ssh -T git@github.com 2>&1 | head -1

# Test clone
echo "Testing repository clone..."
git clone --depth 1 --branch master git@github.com:himanshukhatri-dev/resortwala.git /tmp/test_clone_$$ 2>&1 | tail -3
rm -rf /tmp/test_clone_$$

echo "Setup complete! Try deployment now."
ENDSSH
```

After running this, try:
```powershell
.\deploy_auto.ps1
```

---

## Still Not Working?

### Check SSH keys on server:
```bash
ssh root@77.37.47.243 "cat ~/.ssh/*.pub"
```

### Check GitHub deploy keys:
https://github.com/himanshukhatri-dev/resortwala/settings/keys

Make sure one of the keys from the server matches a key on GitHub.
