# Admin Panel Setup

## Create Admin User

Run this command to create an admin user:

```bash
npm run admin:create [username] [password] [email] [full_name]
```

**Example:**
```bash
npm run admin:create admin admin123 admin@casebuddy.com "Admin User"
```

**Default (if no args provided):**
- Username: `admin`
- Password: `admin123`
- Email: `admin@casebuddy.com`
- Full Name: `Admin User`

## Access Admin Panel

1. Create an admin user using the command above
2. Visit: `http://localhost:3000/admin/login`
3. Login with your credentials
4. You'll be redirected to: `/admin/dashboard`

## Admin Features

### Dashboard
- View product count, categories, orders, and pending orders
- See recent orders

### Products Management
- List all products with search and pagination
- Add new products with images and category assignment
- Edit existing products
- Delete products
- Manage stock quantities and pricing

### Categories Management
- View all categories
- Create new categories with slugs
- Edit category names, descriptions, and sorting
- Delete categories (removes products from category but doesn't delete products)

### Orders Management
- View all orders with filters
- Update order status
- View order details and customer information

### Admin Users Management (Admin only)
- Create new admin users
- Manage user roles (admin, manager, staff)
- Deactivate users

## Environment Variables

Add to your `.env.local`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Security Notes

- **Change default password immediately in production**
- Use strong JWT_SECRET in production
- Cookies are httpOnly and secure in production
- Session expires after 24 hours
- Only admins can manage other admin users
