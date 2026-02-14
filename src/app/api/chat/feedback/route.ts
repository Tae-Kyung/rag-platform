import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, rating, comment } = body;

    if (!messageId || !rating) {
      return errorResponse('Missing required fields');
    }

    if (rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5');
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('feedback')
      .insert({ message_id: messageId, rating, comment })
      .select()
      .single();

    if (error) {
      return errorResponse('Failed to save feedback', 500);
    }

    return successResponse(data, 201);
  } catch {
    return errorResponse('Internal server error', 500);
  }
}
