import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL } from '@/config/constants';
import { z } from 'zod';

const generatePromptSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contact_email: z.string().email().max(200).optional(),
  contact_phone: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = generatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    const { name, description, contact_email, contact_phone } = parsed.data;

    let contactInfo = '';
    if (contact_email || contact_phone) {
      const parts: string[] = [];
      if (contact_phone) parts.push(`전화: ${contact_phone}`);
      if (contact_email) parts.push(`이메일: ${contact_email}`);
      contactInfo = `\n\n사용자가 제공한 연락처 정보:\n${parts.join('\n')}`;
    }

    const metaPrompt = `You are a prompt engineer. Generate a system prompt for a Q&A chatbot with the following details:

- Bot name: ${name}${description ? `\n- Bot description: ${description}` : ''}${contactInfo}

Requirements for the generated system prompt:
1. Define the bot's role and personality based on the name and description
2. Instruct it to answer based only on provided reference materials (RAG context)
3. When unable to answer, politely say so${contact_email || contact_phone ? ' and guide the user to the provided contact information' : ''}
4. Keep a professional and friendly tone
5. Answer concisely but thoroughly
6. Write the system prompt in Korean

Output ONLY the system prompt text, nothing else.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: metaPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const systemPrompt = completion.choices[0]?.message?.content?.trim() || '';

    if (!systemPrompt) {
      return errorResponse('Failed to generate prompt', 500);
    }

    return successResponse({ system_prompt: systemPrompt });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
