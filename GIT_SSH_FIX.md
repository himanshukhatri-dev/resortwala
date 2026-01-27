# 🔧 Final Git SSH Fix

## You Have a Deploy Key on GitHub ✅
- **Jenkins Deploy Key** (SHA256:XXAZDghyrLLJT69zHhfz+8dHUA6QAvXC5nRIRDIaUCE)
- Added Jan 6, 2026
- Has Read/write access

## Problem
The server can't authenticate with GitHub using this key.

## Solution: Verify and Fix SSH Key

### Step 1: Check which SSH key is on the server

```bash
ssh root@77.37.47.243
```

Once logged in:

```bash
# List all SSH keys
ls -la ~/.ssh/

# Show fingerprint of each key
for key in ~/.ssh/id_*; do
    if [ -f "$key" ] && [[ ! "$key" =~ \.pub$ ]]; then
        echo "Key: $key"
        ssh-keygen -lf "$key"
    fi
done
```

**Look for a key with fingerprint ending in `...RDIaUCE`** (matches your GitHub deploy key)

### Step 2: If the key exists, test it

```bash
# Test GitHub connection
ssh -T git@github.com
```

**Expected output:**
```
Hi himanshukhatri-dev! You've successfully authenticated, but GitHub does not provide shell access.
```

### Step 3: If it says "Permission denied"

The key on the server doesn't match the one on GitHub. You need to either:

**Option A: Add the server's key to GitHub**

```bash
# Show the server's public key
cat ~/.ssh/id_rsa.pub
# OR
cat ~/.ssh/id_ed25519.pub
```

Copy the output, then:
1. Go to: https://github.com/himanshukhatri-dev/resortwala/settings/keys
2. Click "Add deploy key"
3. Title: `ResortWala Server - New`
4. Paste the key
5. ✅ Check "Allow write access"
6. Click "Add key"

**Option B: Use the existing Jenkins key**

If you have the Jenkins private key file, copy it to the server:

```bash
# On your local machine (if you have the Jenkins key)
scp /path/to/jenkins_key root@77.37.47.243:~/.ssh/id_rsa
ssh root@77.37.47.243 "chmod 600 ~/.ssh/id_rsa"
```

### Step 4: Test again

```bash
ssh -T git@github.com
```

Should work now!

### Step 5: Exit and deploy

```bash
exit  # Exit from server
```

On your local machine:
```powershell
.\deploy_auto.ps1
```

---

## Quick Test Command

Run this from your local machine to test if Git works on the server:

```bash
ssh root@77.37.47.243 "git clone --depth 1 git@github.com:himanshukhatri-dev/resortwala.git /tmp/test && echo 'SUCCESS!' || echo 'FAILED'"
```

If it says **SUCCESS**, you're ready to deploy!

---

## Still Stuck?

The easiest solution is to generate a fresh key and add it to GitHub:

```bash
ssh root@77.37.47.243 "ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N '' && cat ~/.ssh/id_ed25519.pub"
```

Copy the output and add it as a new deploy key on GitHub:
https://github.com/himanshukhatri-dev/resortwala/settings/keys
