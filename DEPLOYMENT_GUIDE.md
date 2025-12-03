# Deployment Guide - Isolating Casetool Subdomain

## Current Architecture

Your app runs on **port 3000** with subdomain isolation via middleware.

### How Subdomain Isolation Works

```
casetool.casebuddy.co.in → Port 3000 → /casetool/* routes
casebuddy.co.in          → Port 3000 → all other routes
```

The middleware automatically:
- Routes `casetool.` subdomain requests to `/casetool/*`
- Keeps main domain routes separate
- Prevents cross-contamination

## Deployment Options

### Option 1: Single App (Current Setup - RECOMMENDED)

**Pros:**
- ✅ Simple deployment
- ✅ Shared code/components
- ✅ One PM2 process
- ✅ Already working

**Structure:**
```
app/
  page.tsx              # Main domain homepage (casebuddy.co.in)
  about/
    page.tsx            # casebuddy.co.in/about
  pricing/
    page.tsx            # casebuddy.co.in/pricing
  casetool/             # casetool.casebuddy.co.in
    page.tsx            # Isolated - only on subdomain
    gallery/
    billing/
```

**Nginx Config:**
```nginx
# Both domains point to same Next.js app
server {
    server_name casebuddy.co.in;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}

server {
    server_name casetool.casebuddy.co.in;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

**To Add Main Domain Pages:**
1. Create `app/page.tsx` for homepage
2. Add any routes outside `/casetool`
3. Middleware keeps them separate
4. Deploy once, both domains work

---

### Option 2: Separate Apps (More Isolated)

**Pros:**
- ✅ Complete code isolation
- ✅ Independent deployments
- ✅ Different dependencies possible

**Cons:**
- ❌ Two PM2 processes
- ❌ Duplicate code
- ❌ More complex

**Structure:**
```
/var/www/
  casebuddy-main/       # Port 3001 - Main website
  casebuddy-casetool/   # Port 3000 - Casetool (current)
```

**Nginx Config:**
```nginx
server {
    server_name casebuddy.co.in;
    location / {
        proxy_pass http://localhost:3001;  # Main app
    }
}

server {
    server_name casetool.casebuddy.co.in;
    location / {
        proxy_pass http://localhost:3000;  # Casetool app
    }
}
```

**Setup Steps:**
```bash
# 1. Clone repo for main website
cd /var/www
git clone <your-repo> casebuddy-main
cd casebuddy-main

# 2. Remove casetool from main
rm -rf app/casetool

# 3. Create homepage
cat > app/page.tsx << 'EOF'
export default function Home() {
  return <div>Main Website</div>
}
EOF

# 4. Update package.json port
# Change: "start": "next start -p 3001"

# 5. Build and start
npm install
npm run build
pm2 start npm --name "casebuddy-main" -- start
```

---

### Option 3: Reverse Proxy Split (Best of Both)

Keep one codebase but route to different builds:

**Nginx Config:**
```nginx
# Main domain - only serve non-casetool routes
server {
    server_name casebuddy.co.in;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
    
    # Block casetool routes on main domain
    location /casetool {
        return 404;
    }
}

# Subdomain - only serve casetool routes
server {
    server_name casetool.casebuddy.co.in;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

---

## Recommended Approach

**Use Option 1 (Single App)**

Your current setup is perfect! Just add main domain pages:

```bash
# Create homepage
cat > app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to CaseBuddy</h1>
      <a href="https://casetool.casebuddy.co.in">Go to Case Tool</a>
    </div>
  )
}
EOF

# Restart
pm2 restart casebuddy-nextjs
```

The middleware ensures:
- `casebuddy.co.in/` → Shows homepage
- `casetool.casebuddy.co.in/` → Shows casetool (isolated)
- No interference between them

---

## Testing Isolation

```bash
# Test main domain doesn't access casetool
curl http://casebuddy.co.in/casetool
# Should show main site, not casetool

# Test subdomain only shows casetool
curl http://casetool.casebuddy.co.in/
# Should redirect to casetool pages
```

---

## Database Separation (If Needed)

If you want completely separate databases:

```typescript
// lib/db-main.ts (for main website)
const mainPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'casebuddy_main',
  password: process.env.MAIN_DB_PASSWORD,
});

// lib/db.ts (for casetool - keep as is)
const casetoolPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'casebuddy',
  password: process.env.DB_PASSWORD,
});
```

---

## Summary

✅ **Your current setup is ALREADY isolated**  
✅ **Middleware handles subdomain routing**  
✅ **Just add pages outside `/casetool` for main domain**  
✅ **Deploy once, both domains work independently**

No changes needed to existing casetool code!
