# Phone Brands & Models Import from Excel

This script automatically imports phone brands and their models from an Excel file into your database.

## Setup Steps

### 1. Install Required Package
```bash
npm install xlsx
```

### 2. Prepare Your Excel File

Save your Excel file as `phones.xlsx` in the `scripts/` folder.

**Expected Format:**
- Column A contains both brand names and model names
- Brand name appears first (e.g., "Apple")
- Models follow below (e.g., "Apple iPhone 11", "Apple iPhone 12", etc.)
- Next brand name, then its models, and so on

Example:
```
Apple
Apple iPhone 11
Apple iPhone 11 Pro
Apple iPhone 12
Apple iPhone 12 Mini
OnePlus
OnePlus 10 Pro 5G
OnePlus 11 5G
```

### 3. Update Database Credentials (if needed)

Edit `scripts/import-phones-from-excel.js` and update:
```javascript
const DB_CONFIG = {
  host: 'localhost',
  user: 'case_main',
  password: 'main',
  database: 'case_main',
};
```

### 4. Run the Import

```bash
node scripts/import-phones-from-excel.js
```

## What It Does

1. **Reads Excel File**: Parses the `phones.xlsx` file
2. **Detects Brands**: Identifies brand headers (rows that don't start with existing brand name)
3. **Creates Brands**: Inserts new brands into `phone_brands` table
4. **Creates Models**: Inserts phone models under their respective brands into `phone_models` table
5. **Generates Slugs**: Automatically creates URL-friendly slugs
6. **Avoids Duplicates**: Checks for existing brands/models before inserting

## Output

You'll see progress like:
```
📖 Reading Excel file...
✅ Found 150 rows in Excel
🔌 Connecting to database...
✅ Database connected

📱 Processing brand: Apple
   ✅ Brand created (ID: 1)
   ✅ Added model: Apple iPhone 11
   ✅ Added model: Apple iPhone 11 Pro
   ...

📱 Processing brand: OnePlus
   ✅ Brand created (ID: 2)
   ✅ Added model: OnePlus 10 Pro 5G
   ...

🎉 Import completed!
📊 Summary:
   - Brands processed/created: 2
   - Models added: 45
```

## Troubleshooting

**Error: Cannot find module 'xlsx'**
- Run: `npm install xlsx`

**Error: ENOENT: no such file or directory**
- Make sure `phones.xlsx` is in the `scripts/` folder

**Database connection error**
- Check your database credentials in the script
- Ensure MySQL is running
- Verify database name is correct

## Alternative: CSV Format

If you prefer CSV, save as `phones.csv` and modify the script:
```javascript
// Change this line:
const workbook = XLSX.readFile('./scripts/phones.xlsx');
// To:
const workbook = XLSX.readFile('./scripts/phones.csv');
```

CSV format works the same way - just one column with brand names and models.
