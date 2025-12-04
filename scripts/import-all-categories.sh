#!/bin/bash

echo "🚀 Starting bulk product import for all categories..."
echo ""

# Array of category data: slug|name|json_file
categories=(
  "black-bumper-case|Black Bumper Case|atcasa_data2.json"
  "black-transparent-bumper-iphone-cases|Black Transparent Bumper iPhone Cases|atcasa_data3.json"
  "best-sellers-custom-cases|Best Sellers Custom Cases|atcasa_data4.json"
  "gripper-phone-cases|Gripper Phone Cases|atcasa_data5.json"
  "initial-phone-cases|Initial Phone Cases|atcasa_data6.json"
  "evil-eye-phone-cases|Evil Eye Phone Cases|atcasa_data7.json"
  "full-print-silicone-case|Full Print Silicone Case|atcasa_data8.json"
)

total=${#categories[@]}
current=0

for category_data in "${categories[@]}"; do
  current=$((current + 1))
  
  IFS='|' read -r slug name json_file <<< "$category_data"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Category $current/$total: $name"
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
