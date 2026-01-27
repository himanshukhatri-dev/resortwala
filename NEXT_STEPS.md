# 🔑 Git SSH Setup - Next Steps

## Current Status

✅ GitHub added to known_hosts  
❌ No SSH key authorized on GitHub (Permission denied)

## What You Need to Do

### Option 1: Check Existing Keys (Quickest)

1. **Check if you already have deploy keys on GitHub:**
   - Go to: https://github.com/himanshukhatri-dev/resortwala/settings/keys
   - If you see any keys listed, one might already be set up

2. **Check what SSH keys exist on the server:**
   ```bash
   ssh root@77.37.47.243 "ls -la ~/.ssh/ && echo '---' && cat ~/.ssh/*.pub 2>/dev/null"
   ```

3. **If you see a key on the server that matches one on GitHub**, just test the connection:
   ```bash
   ssh root@77.37.47.243 "ssh -T git@github.com"
   ```

### Option 2: Create New Deploy Key (If none exists)

**On your local machine, run:**

```bash
# Step 1: Generate key on server and show it
ssh root@77.37.47.243 "ssh-keygen -t ed25519 -C 'deploy@resortwala' -f ~/.ssh/id_ed25519 -N '' && cat ~/.ssh/id_ed25519.pub"
```

**Copy the output (starts with `ssh-ed25519`)**

**Step 2: Add to GitHub**
1. Go to: https://github.com/himanshukhatri-dev/resortwala/settings/keys
2. Click "Add deploy key"
3. Title: `ResortWala Server`
4. Paste the key
5. Click "Add key"

**Step 3: Test**
```bash
ssh root@77.37.47.243 "ssh -T git@github.com"
```

Should output: `Hi himanshukhatri-dev! You've successfully authenticated...`

**Step 4: Try deployment**
```powershell
.\deploy_auto.ps1
```

---

## Quick Links

- **GitHub Deploy Keys**: https://github.com/himanshukhatri-dev/resortwala/settings/keys
- **Repository**: https://github.com/himanshukhatri-dev/resortwala

---

## After Setup Works

Once Git access is working, you can deploy with:

```powershell
.\deploy_auto.ps1
```

Choose:
- Environment: **1** (Beta)
- Branch: **1** (master)
- Component: **5** (All Components)

The deployment will pull code from GitHub and deploy to beta.resortwala.com!
