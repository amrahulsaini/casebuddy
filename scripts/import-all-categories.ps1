# PowerShell script to import all categories

Write-Host "🚀 Starting bulk product import for all categories..." -ForegroundColor Cyan
Write-Host ""

$categories = @(
    @{slug="black-bumper-case"; name="Black Bumper Case"; json="atcasa_data2.json"},
    @{slug="black-transparent-bumper-iphone-cases"; name="Black Transparent Bumper iPhone Cases"; json="atcasa_data3.json"},
    @{slug="best-sellers-custom-cases"; name="Best Sellers Custom Cases"; json="atcasa_data4.json"},
    @{slug="gripper-phone-cases"; name="Gripper Phone Cases"; json="atcasa_data5.json"},
    @{slug="initial-phone-cases"; name="Initial Phone Cases"; json="atcasa_data6.json"},
    @{slug="evil-eye-phone-cases"; name="Evil Eye Phone Cases"; json="atcasa_data7.json"},
    @{slug="full-print-silicone-case"; name="Full Print Silicone Case"; json="atcasa_data8.json"}
)

$total = $categories.Count
$current = 0

foreach ($category in $categories) {
    $current++
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📦 Category $current/$total: $($category.name)" -ForegroundColor Yellow
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
