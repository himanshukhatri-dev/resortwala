# 🔑 Add Deploy Key - Simple Steps

## Step 1: Generate SSH Key on Server

Copy and paste this command:

```bash
ssh root@77.37.47.243 "ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N '' && cat ~/.ssh/id_ed25519.pub"
```

**You'll see output like:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJx... root@server
```

**Copy the entire line** (starts with `ssh-ed25519`)

---

## Step 2: Add Key to GitHub

1. **Go to:** https://github.com/himanshukhatri-dev/resortwala/settings/keys

2. **Click:** "Add deploy key" (green button)

3. **Fill in:**
   - **Title:** `ResortWala Server Deploy`
   - **Key:** Paste the key you copied from Step 1
   - ✅ **Check:** "Allow write access" (optional, but recommended)

4. **Click:** "Add key"

---

## Step 3: Test Connection

```bash
ssh root@77.37.47.243 "ssh -T git@github.com"
```

**Expected output:**
```
Hi himanshukhatri-dev! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see this ✅ **SUCCESS!** Git is working.

---

## Step 4: Deploy!

```powershell
.\deploy_auto.ps1
```

**Choose:**
- Environment: `1` (Beta)
- Branch: `1` (master)  
- Component: `5` (All Components)

**Wait 5-10 minutes** for the deployment to complete.

---

## Troubleshooting

### If Step 1 says "file already exists"

The key already exists. Just show it:

```bash
ssh root@77.37.47.243 "cat ~/.ssh/id_ed25519.pub"
```

Copy the output and proceed to Step 2.

### If Step 3 says "Permission denied"

The key wasn't added correctly to GitHub. Double-check:
1. You copied the **entire** key (including `ssh-ed25519` at the start)
2. You pasted it in the **Key** field (not Title)
3. You clicked **"Add key"**

Try Step 2 again.

---

## That's It!

Once Step 3 shows "successfully authenticated", you're ready to deploy! 🚀
