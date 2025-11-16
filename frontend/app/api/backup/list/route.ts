/**
 * Backup List API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/lib/backup/backup-service';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';
import { getUserId } from '@/lib/auth-utils';

export const runtime = 'nodejs'; // May require Node.js for file operations

// Only admins can access backups
async function checkAdmin(userId: string): Promise<boolean> {
  // Check if user is admin via environment variable or database
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  if (adminUserIds.includes(userId)) {
    return true;
  }
  
  // In development, allow if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_ADMIN === 'true') {
    return true;
  }
  
  // TODO: Check database for admin role if user roles table exists
  // const user = await db.user.findUnique({ where: { id: userId } });
  // return user?.role === 'admin';
  
  return false;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  if (!(await checkAdmin(userId))) {
    throw new AuthorizationError('Admin access required');
  }

  const backupService = new BackupService();
  const backups = backupService.listBackups();

  return NextResponse.json({ backups });
});
