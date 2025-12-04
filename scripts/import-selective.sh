#!/bin/bash

echo "🚀 Starting bulk product import..."
echo ""

# Fix images for category 2 (black-bumper-case)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Category 1: Black Bumper Case - Fixing Images Only"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
node scripts/fix-category-images.js black-bumper-case atcasa_data2.json
echo ""
sleep 2

# Import complete products for categories 3-8
categories=(
  "black-transparent-bumper-iphone-cases|Black Transparent Bumper iPhone Cases|atcasa_data3.json"
  "best-sellers-custom-cases|Best Sellers Custom Cases|atcasa_data4.json"
  "gripper-phone-cases|Gripper Phone Cases|atcasa_data5.json"
  "initial-phone-cases|Initial Phone Cases|atcasa_data6.json"
  "evil-eye-phone-cases|Evil Eye Phone Cases|atcasa_data7.json"
  "full-print-silicone-case|Full Print Silicone Case|atcasa_data8.json"
)

total=${#categories[@]}
current=1

for category_data in "${categories[@]}"; do
  current=$((current + 1))
  
  IFS='|' read -r slug name json_file <<< "$category_data"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Category $current/7: $name - Full Import"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  node scripts/import-all-products.js "$slug" "$name" "$json_file"
  
  if [ $? -eq 0 ]; then
    echo "✅ Successfully imported $name"
  else
    echo "❌ Failed to import $name"
  fi
  
  echo ""
  sleep 2
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All imports completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
