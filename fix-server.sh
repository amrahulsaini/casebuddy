#!/bin/bash
# Remove conflicting route on server
cd /home/casebuddy.co.in/public_html/casebuddy
rm -rf app/api/orders/\[orderId\]
echo "Deleted conflicting [orderId] route"
