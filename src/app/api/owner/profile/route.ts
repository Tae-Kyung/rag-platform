import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/profile
 * Returns user profile.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceRoleClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at')
      .eq('id', user.id)
      .single();

    return successResponse(profile);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to fetch profile', 500);
  }
}

/**
 * PUT /api/owner/profile
 * Updates user profile (full_name, avatar_url).
 * Optionally changes password if provided.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Update profile fields
    const updates: Record<string, unknown> = {};
    if (body.full_name !== undefined) {
      updates.full_name = body.full_name;
    }
    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        return errorResponse('Failed to update profile', 500);
      }
    }

    // Password change
    if (body.new_password) {
      if (!body.new_password || body.new_password.length < 6) {
        return errorResponse('Password must be at least 6 characters', 400);
      }

      const authClient = await createClient();
      const { error: pwError } = await authClient.auth.updateUser({
        password: body.new_password,
      });

      if (pwError) {
        return errorResponse(pwError.message, 400);
      }
    }

    // Fetch updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at')
      .eq('id', user.id)
      .single();

    return successResponse(profile);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to update profile', 500);
  }
}
