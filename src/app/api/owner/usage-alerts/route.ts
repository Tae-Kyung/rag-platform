import { requireAuth, AuthError } from '@/lib/auth/guards';
import { getUsageAlertLevel } from '@/lib/billing/plan-guard';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/usage-alerts
 * Returns alert levels for messages, storage, and bots.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const alerts = await getUsageAlertLevel(user.id);
    return successResponse(alerts);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to fetch usage alerts', 500);
  }
}
