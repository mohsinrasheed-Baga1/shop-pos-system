#!/bin/bash
# Test the packaged AppImage end-to-end. Self-contained cleanup.
set +e
pkill -9 -f "shop-pos-system" 2>/dev/null
pkill -9 -f "server.js" 2>/dev/null
pkill -9 Xvfb 2>/dev/null
sleep 2
rm -rf /home/z/.config/shop-pos-system 2>/dev/null

Xvfb :99 -screen 0 1280x800x24 > /tmp/xvfb-final.log 2>&1 &
XVFB=$!
sleep 2

cd /tmp/ai3
DISPLAY=:99 NODE_ENV=production ./squashfs-root/AppRun --no-sandbox --disable-gpu > /tmp/final-test.log 2>&1 &
APP=$!
echo "App PID: $APP"

# Wait for server
HTTP=""
for i in $(seq 1 20); do
  sleep 2
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://127.0.0.1:4783/ 2>/dev/null)
  echo "attempt $i: HTTP $HTTP"
  if [ "$HTTP" = "200" ]; then break; fi
done

echo "===PAGE RENDER==="
curl -s --max-time 5 http://127.0.0.1:4783/ 2>/dev/null | grep -oE "Sign In|Shop POS|Email|Password|Demo accounts" | head -5

echo "===SEED API==="
curl -s --max-time 10 -X POST http://127.0.0.1:4783/api/seed 2>/dev/null | head -c 150
echo ""

echo "===DB STATE==="
echo "Users:"; sqlite3 /home/z/.config/shop-pos-system/pos.db "SELECT email, role FROM User;" 2>/dev/null
echo "Categories:"; sqlite3 /home/z/.config/shop-pos-system/pos.db "SELECT name FROM Category;" 2>/dev/null
echo "Settings:"; sqlite3 /home/z/.config/shop-pos-system/pos.db "SELECT shopName, currency FROM Settings;" 2>/dev/null

echo "===LOGIN TEST==="
curl -s -c /tmp/cj2 --max-time 5 http://127.0.0.1:4783/api/auth/csrf 2>/dev/null | grep -oE '"csrfToken"' > /dev/null && echo "csrf ok"
curl -s -b /tmp/cj2 -c /tmp/cj2 --max-time 10 -X POST http://127.0.0.1:4783/api/auth/callback/credentials -H "Content-Type: application/x-www-form-urlencoded" -d "email=admin@pos.local&password=admin123" -o /dev/null -w "login redirect: %{http_code}\n"

echo "===AUTHED API==="
curl -s -b /tmp/cj2 --max-time 5 http://127.0.0.1:4783/api/categories 2>/dev/null | grep -oE '"name":"[^"]*"' | head -5
curl -s -b /tmp/cj2 --max-time 5 http://127.0.0.1:4783/api/settings 2>/dev/null | grep -oE '"shopName":"[^"]*"|"currency":"[^"]*"' | head -2

echo "===KEY LOG==="
grep -iE "POS\]|server\]|Ready|Copied template|error|Cannot find|MODULE_NOT_FOUND" /tmp/final-test.log 2>/dev/null | grep -vE "prisma:query|GPU|gbm|EGL|Vulkan|libva|swift|sandbox|dbus|dri3|gpu_mem|Fontconfig|crashpad|DeprecationWarning|url.parse" | tail -8

echo "===CLEANUP==="
kill -9 $APP 2>/dev/null
kill -9 $XVFB 2>/dev/null
pkill -9 -f "shop-pos-system" 2>/dev/null
pkill -9 -f "server.js" 2>/dev/null
pkill -9 Xvfb 2>/dev/null
sleep 2
echo "DONE"
