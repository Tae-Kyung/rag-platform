import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { handleKakaoMessageWithTimeout } from '@/lib/channels/kakao/handler';
import type { KakaoSkillRequest, KakaoSkillResponse } from '@/lib/channels/kakao/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

function buildKakaoResponse(text: string): KakaoSkillResponse {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          simpleText: { text },
        },
      ],
    },
  };
}

function buildErrorResponse(message?: string): KakaoSkillResponse {
  return buildKakaoResponse(
    message || '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  );
}

/**
 * POST /api/webhooks/kakao/[botId]
 * Receives Kakao i Open Builder skill requests for a specific bot.
 * Returns a synchronous KakaoSkillResponse (no separate send API).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const supabase = createServiceRoleClient();

    // Look up channel config for this bot
    const { data: channelConfig } = await supabase
      .from('channel_configs')
      .select('config, is_active')
      .eq('bot_id', botId)
      .eq('channel', 'kakao')
      .single();

    if (!channelConfig || !channelConfig.is_active) {
      return NextResponse.json(
        buildErrorResponse('이 봇의 카카오톡 채널이 비활성화 상태입니다.')
      );
    }

    // Load bot settings
    const { data: bot } = await supabase
      .from('bots')
      .select('name, system_prompt, model, temperature, max_tokens, is_active')
      .eq('id', botId)
      .single();

    if (!bot || !bot.is_active) {
      return NextResponse.json(
        buildErrorResponse('이 봇은 현재 비활성화 상태입니다.')
      );
    }

    const skillRequest: KakaoSkillRequest = await request.json();
    const utterance = skillRequest.userRequest?.utterance?.trim();
    const kakaoUserId = skillRequest.userRequest?.user?.id;

    if (!utterance || !kakaoUserId) {
      return NextResponse.json(
        buildErrorResponse('메시지를 처리할 수 없습니다.')
      );
    }

    const responseText = await handleKakaoMessageWithTimeout(utterance, kakaoUserId, {
      botId,
      name: bot.name,
      systemPrompt: bot.system_prompt,
      model: bot.model,
      temperature: bot.temperature,
      maxTokens: bot.max_tokens,
    });

    return NextResponse.json(buildKakaoResponse(responseText));
  } catch (error) {
    console.error('Kakao webhook error:', error);
    return NextResponse.json(buildErrorResponse());
  }
}
