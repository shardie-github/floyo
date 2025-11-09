/**
 * Backup List API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/lib/backup/backup-service';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';
import { getUserId } from '@/lib/auth-utils';

// Only admins can access backups
async function checkAdmin(userId: string): Promise<boolean> {
  // TODO: Implement admin check
  return process.env.NODE_ENV === 'development';
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
