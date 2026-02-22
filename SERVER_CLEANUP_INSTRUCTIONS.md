# SERVER CLEANUP INSTRUCTIONS
# Delete billing data totaling ₹13,150

## Option 1: Using SQL Queries (Manual)

### Step 1: Backup your database
```bash
ssh your-server
mysqldump -u case_tool -p case_tool > backup_before_delete_$(date +%Y%m%d).sql
```

### Step 2: Connect to MySQL
```bash
mysql -u case_tool -p case_tool
```

### Step 3: Run queries from database/delete-billing-13150.sql
Copy and paste the queries one by one:
1. First run STEP 1 (CHECK DATA) to see what you have
2. Then run STEP 2 (FIND ENTRIES) to see what will be deleted
3. Run STEP 3 (GET IMAGE URLS) and save the output
4. Run STEP 4 (DELETE DATA) to delete database records
5. Run STEP 5 (VERIFY) to confirm deletion

### Step 4: Delete image files manually
```bash
# Using the URLs from STEP 3, delete files like:
cd /home/your-user/casetool/public
rm -f /uploads/casetool/[filename-from-urls].jpg
```

---

## Option 2: Using Node.js Script (Automated - RECOMMENDED)

### Step 1: Upload script to server
```bash
# From your local machine:
scp cleanup-billing-on-server.js your-server:/home/your-user/casetool/
```

### Step 2: SSH into server
```bash
ssh your-server
cd /home/your-user/casetool
```

### Step 3: Install mysql2 if not already installed
```bash
npm install mysql2
```

### Step 4: Update database credentials in the script
```bash
nano cleanup-billing-on-server.js
# Edit these lines:
#   host: 'localhost',
#   user: 'case_tool',
#   password: 'tool',
#   database: 'case_tool',
```

### Step 5: Run the script
```bash
node cleanup-billing-on-server.js
```

The script will:
- Show you all entries to be deleted
- Wait 5 seconds for you to cancel (Ctrl+C)
- Delete database records
- Delete image files
- Clean up orphaned generation logs

---

## What Gets Deleted

- ❌ Download billing logs entries (oldest first) totaling ₹13,150
- ❌ Corresponding image files from public/uploads/casetool/
- ❌ Orphaned generation_logs (if no other downloads reference them)

## What Stays

- ✓ User accounts
- ✓ All billing data after the ₹13,150 threshold
- ✓ All API usage logs (for tracking)
- ✓ Recent images and generation logs

---

## Verification After Deletion

Run this query to check remaining download cost:
```sql
SELECT 
  COUNT(*) as remaining_downloads,
  SUM(amount_inr) as remaining_cost_inr
FROM download_billing_logs;
```

---

## Rollback (if something goes wrong)

If you made a backup:
```bash
mysql -u case_tool -p case_tool < backup_before_delete_YYYYMMDD.sql
```

---

## Files Provided

1. **database/delete-billing-13150.sql** - SQL queries to run manually
2. **cleanup-billing-on-server.js** - Node.js script for automated cleanup
3. **SERVER_CLEANUP_INSTRUCTIONS.md** - This file
