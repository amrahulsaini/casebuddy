import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'staff';
}

export async function createToken(user: AdminUser): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.user as AdminUser;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  
  if (!token) return null;
  
  return await verifyToken(token);
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getSession();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireRole(allowedRoles: ('admin' | 'manager' | 'staff')[]): Promise<AdminUser> {
  const user = await requireAdmin();
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  
  return user;
}
