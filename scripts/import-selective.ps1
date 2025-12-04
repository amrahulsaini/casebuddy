# PowerShell script for selective import

Write-Host "🚀 Starting bulk product import..." -ForegroundColor Cyan
Write-Host ""

# Fix images for category 2 (black-bumper-case)
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔧 Category 1: Black Bumper Case - Fixing Images Only" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
node scripts/fix-category-images.js black-bumper-case atcasa_data2.json
Write-Host ""
Start-Sleep -Seconds 2

# Import complete products for categories 3-8
$categories = @(
    @{slug="black-transparent-bumper-iphone-cases"; name="Black Transparent Bumper iPhone Cases"; json="atcasa_data3.json"},
    @{slug="best-sellers-custom-cases"; name="Best Sellers Custom Cases"; json="atcasa_data4.json"},
    @{slug="gripper-phone-cases"; name="Gripper Phone Cases"; json="atcasa_data5.json"},
    @{slug="initial-phone-cases"; name="Initial Phone Cases"; json="atcasa_data6.json"},
    @{slug="evil-eye-phone-cases"; name="Evil Eye Phone Cases"; json="atcasa_data7.json"},
    @{slug="full-print-silicone-case"; name="Full Print Silicone Case"; json="atcasa_data8.json"}
)

$current = 1

foreach ($category in $categories) {
    $current++
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📦 Category $current/7: $($category.name) - Full Import" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    node scripts/import-all-products.js $category.slug $category.name $category.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully imported $($category.name)" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to import $($category.name)" -ForegroundColor Red
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🎉 All imports completed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
