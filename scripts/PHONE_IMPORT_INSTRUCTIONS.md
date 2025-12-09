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