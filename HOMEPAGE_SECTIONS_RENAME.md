# Homepage Sections → Page Sections Rename

## Summary
Successfully renamed `homepage_sections` table to `page_sections` throughout the entire codebase for better clarity, since the table stores sections for all pages, not just the homepage.

## Database Changes

### SQL Migration Required
Run this SQL command on your database:
```sql
RENAME TABLE homepage_sections TO page_sections;
```

**Migration file location:** `database/rename-homepage-sections.sql`

## Code Changes Made

### 1. API Routes Renamed
- `/api/homepage-sections` → `/api/page-sections`
- `/api/admin/homepage-sections` → `/api/admin/page-sections`
- `/api/admin/homepage-sections/[id]` → `/api/admin/page-sections/[id]`

### 2. Admin Dashboard Routes Renamed
- `/admin/dashboard/homepage-sections` → `/admin/dashboard/page-sections`

### 3. Files Modified (15 total)

**API Routes:**
- `app/api/page-sections/route.ts` - Updated table name in SELECT query
- `app/api/admin/page-sections/route.ts` - Updated table name in GET and POST queries, fixed syntax error
- `app/api/admin/page-sections/[id]/route.ts` - Updated table name in PUT and DELETE queries
- `app/api/admin/pages/route.ts` - Updated table name in LEFT JOIN
- `app/api/admin/pages/[id]/route.ts` - Updated comment about cascade delete
- `app/api/admin/pages/[id]/sections/route.ts` - Updated table name in JOIN query
- `app/api/pages/[slug]/route.ts` - Updated table name in SELECT query

**Admin Pages:**
- `app/admin/dashboard/page.tsx` - Updated quick link route and label
- `app/admin/dashboard/page-sections/page.tsx` - Updated API endpoint URLs
- `app/admin/dashboard/sections/page.tsx` - Updated API endpoint URLs
- `app/admin/dashboard/categories/page.tsx` - Updated API endpoint URL

**Public Pages:**
- `app/page.tsx` - Updated API endpoint URL

**Database:**
- `database/rename-homepage-sections.sql` - New migration file created

### 4. All Database Queries Updated
Changed all SQL queries from:
```sql
SELECT * FROM homepage_sections WHERE ...
INSERT INTO homepage_sections ...
UPDATE homepage_sections SET ...
DELETE FROM homepage_sections WHERE ...
```

To:
```sql
SELECT * FROM page_sections WHERE ...
INSERT INTO page_sections ...
UPDATE page_sections SET ...
DELETE FROM page_sections WHERE ...
```

### 5. Error Messages Updated
All error messages and console logs updated from "homepage section" to "page section"

## What You Need to Do

### Step 1: Run Database Migration
Execute the SQL migration on your production database:
```bash
mysql -u your_user -p case_main < database/rename-homepage-sections.sql
```

Or run directly in your database client:
```sql
RENAME TABLE homepage_sections TO page_sections;
```

### Step 2: Update Bookmarks/Links
If you have any bookmarked admin pages, update:
- Old: `https://casebuddy.co.in/admin/dashboard/homepage-sections`
- New: `https://casebuddy.co.in/admin/dashboard/page-sections`

### Step 3: Clear Application Cache
After deploying these changes, clear your application cache if applicable.

## Testing Checklist

After deploying and running the migration:

- [ ] Visit `/admin/dashboard/page-sections` - Should load section management page
- [ ] Create a new section - Should save to `page_sections` table
- [ ] Edit an existing section - Should update `page_sections` table
- [ ] Delete a section - Should remove from `page_sections` table
- [ ] Visit homepage - Should load sections correctly from `page_sections`
- [ ] Visit any dynamic page - Should load sections correctly from `page_sections`
- [ ] Check admin dashboard quick links - Should show "Page Sections" with correct link

## Benefits of This Change

1. **Clarity**: Table name now accurately reflects that it stores sections for ALL pages, not just homepage
2. **Consistency**: Aligns with the `pages` table naming convention
3. **Maintainability**: Future developers won't be confused about the table's purpose
4. **Scalability**: Makes it clear the system supports multiple pages with sections

## No Breaking Changes

All existing data remains intact - this is purely a rename operation:
- All section IDs remain the same
- All foreign key relationships preserved
- All data in the table unchanged
- Only the table name changes

## Commit
**Hash:** 6e431b7
**Message:** Rename homepage_sections to page_sections throughout codebase
