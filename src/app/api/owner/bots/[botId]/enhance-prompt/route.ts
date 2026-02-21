import { NextRequest } from 'next/server';
import { requireOwner, requirePlan, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL } from '@/config/constants';
import type { PlanId } from '@/types';

const REQUIRED_MESSAGE_COUNT = 100;
const SAMPLE_CONVERSATION_COUNT = 50;
const MESSAGE_TRUNCATE_LENGTH = 500;
const FAILURE_PATTERNS = [
  '참고 자료가 없습니다',
  '관련 정보를 찾을 수 없',
  '답변하기 어렵',
  '해당 정보가 없',
  'I don\'t have',
  'I couldn\'t find',
  'no relevant information',
  'unable to answer',
];

/**
 * GET /api/owner/bots/[botId]/enhance-prompt
 * Check eligibility: plan level + user message count >= 100.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const user = await requireOwner(botId);

    const supabase = createServiceRoleClient();

    // Check plan using service client (bypasses RLS)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .single();

    const planOrder: PlanId[] = ['free', 'starter', 'pro', 'enterprise'];
    const planEligible = !!subscription &&
      subscription.status === 'active' &&
      planOrder.indexOf(subscription.plan_id as PlanId) >= planOrder.indexOf('starter');

    // Get conversation IDs for this bot
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('bot_id', botId);

    const conversationIds = conversations?.map((c) => c.id) ?? [];

    if (conversationIds.length === 0) {
      return successResponse({
        eligible: false,
        planEligible,
        userMessageCount: 0,
        requiredCount: REQUIRED_MESSAGE_COUNT,
      });
    }

    // Count user messages across all conversations
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('role', 'user');

    const userMessageCount = count ?? 0;

    return successResponse({
      eligible: planEligible && userMessageCount >= REQUIRED_MESSAGE_COUNT,
      planEligible,
      userMessageCount,
      requiredCount: REQUIRED_MESSAGE_COUNT,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Enhance prompt eligibility error:', err);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/owner/bots/[botId]/enhance-prompt
 * Analyze conversation data and generate an enhanced system prompt.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    await requireOwner(botId);
    await requirePlan('starter');

    const supabase = createServiceRoleClient();

    // Fetch the bot's current system prompt
    const { data: bot } = await supabase
      .from('bots')
      .select('system_prompt')
      .eq('id', botId)
      .single();

    const currentPrompt = bot?.system_prompt || '';

    // Get recent conversations (70% recent + 30% random for representativeness)
    const recentCount = Math.ceil(SAMPLE_CONVERSATION_COUNT * 0.7); // 35
    const randomCount = SAMPLE_CONVERSATION_COUNT - recentCount;    // 15

    const { data: recentConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .limit(recentCount);

    const recentIds = recentConversations?.map((c) => c.id) ?? [];

    // For random sampling, get all conversation IDs except recent ones
    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('bot_id', botId);

    const allIds = allConversations?.map((c) => c.id) ?? [];
    const remainingIds = allIds.filter((id) => !recentIds.includes(id));

    // Shuffle and pick random samples
    const shuffled = remainingIds.sort(() => Math.random() - 0.5);
    const randomIds = shuffled.slice(0, randomCount);

    const sampleIds = [...recentIds, ...randomIds];

    if (sampleIds.length === 0) {
      return errorResponse('Not enough conversation data', 400);
    }

    // Fetch messages for sampled conversations
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, role, content')
      .in('conversation_id', sampleIds)
      .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
      return errorResponse('No messages found', 400);
    }

    // Group messages by conversation into Q&A pairs
    const conversationMap = new Map<string, { role: string; content: string }[]>();
    for (const msg of messages) {
      const list = conversationMap.get(msg.conversation_id) || [];
      list.push({ role: msg.role, content: msg.content });
      conversationMap.set(msg.conversation_id, list);
    }

    // Extract Q&A pairs (user question + assistant answer)
    const qaPairs: { question: string; answer: string; failed: boolean }[] = [];
    for (const msgs of conversationMap.values()) {
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
          const question = msgs[i].content.slice(0, MESSAGE_TRUNCATE_LENGTH);
          const answer = msgs[i + 1].content.slice(0, MESSAGE_TRUNCATE_LENGTH);
          const failed = FAILURE_PATTERNS.some((p) => answer.includes(p));
          qaPairs.push({ question, answer, failed });
        }
      }
    }

    if (qaPairs.length === 0) {
      return errorResponse('No Q&A pairs found in conversations', 400);
    }

    const failedPairs = qaPairs.filter((p) => p.failed);
    const failedSample = failedPairs.slice(0, 10);
    const successSample = qaPairs.filter((p) => !p.failed).slice(0, 30);

    // Build analysis prompt for LLM
    const analysisPrompt = `You are an expert at improving chatbot system prompts. Analyze the following Q&A data from a chatbot and suggest an improved system prompt.

## Current System Prompt
${currentPrompt || '(No system prompt set)'}

## Successful Q&A Samples (${successSample.length} of ${qaPairs.length - failedPairs.length} total)
${successSample.map((p, i) => `${i + 1}. Q: ${p.question}\n   A: ${p.answer}`).join('\n\n')}

## Failed/Incomplete Answers (${failedSample.length} of ${failedPairs.length} total)
${failedSample.length > 0 ? failedSample.map((p, i) => `${i + 1}. Q: ${p.question}\n   A: ${p.answer}`).join('\n\n') : '(None detected)'}

## Task
Based on the Q&A data above:
1. Identify the top topics users ask about
2. Identify knowledge gaps where the bot failed to answer
3. Recommend a tone/style adjustment if needed
4. Write an improved system prompt that addresses common questions better and handles edge cases

Respond in JSON format:
{
  "enhanced_prompt": "The improved system prompt text in Korean",
  "analysis": {
    "topTopics": ["topic1", "topic2", ...],
    "knowledgeGaps": ["gap1", "gap2", ...],
    "toneRecommendation": "Brief recommendation about tone/style"
  }
}

Important:
- Write the enhanced_prompt in Korean
- Keep the enhanced prompt concise but comprehensive (under 2000 characters)
- Preserve any existing good instructions from the current prompt
- Add specific guidance based on common question patterns
- Output valid JSON only`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    let result: {
      enhanced_prompt: string;
      analysis: {
        topTopics: string[];
        knowledgeGaps: string[];
        toneRecommendation: string;
      };
    };

    try {
      result = JSON.parse(raw);
    } catch {
      return errorResponse('Failed to parse AI response', 500);
    }

    if (!result.enhanced_prompt || !result.analysis) {
      return errorResponse('Invalid AI response structure', 500);
    }

    return successResponse({
      enhanced_prompt: result.enhanced_prompt,
      analysis: {
        ...result.analysis,
        pairsAnalyzed: qaPairs.length,
        failedCount: failedPairs.length,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Enhance prompt generation error:', err);
    return errorResponse('Internal server error', 500);
  }
}
