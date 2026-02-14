// Kakao i Open Builder Skill Server types

export interface KakaoSkillRequest {
  intent: {
    id: string;
    name: string;
  };
  userRequest: {
    timezone: string;
    params: {
      ignoreMe?: string;
      surface?: string;
    };
    block: {
      id: string;
      name: string;
    };
    utterance: string;
    lang: string;
    user: {
      id: string;
      type: string;
      properties: Record<string, string>;
    };
  };
  bot: {
    id: string;
    name: string;
  };
  action: {
    name: string;
    clientExtra: Record<string, unknown> | null;
    params: Record<string, string>;
    id: string;
    detailParams: Record<string, { origin: string; value: string; groupName: string }>;
  };
}

export interface KakaoSimpleText {
  simpleText: {
    text: string;
  };
}

export interface KakaoBasicCard {
  basicCard: {
    title?: string;
    description?: string;
    thumbnail?: {
      imageUrl: string;
    };
    buttons?: Array<{
      action: 'webLink' | 'message' | 'phone';
      label: string;
      webLinkUrl?: string;
      messageText?: string;
      phoneNumber?: string;
    }>;
  };
}

export interface KakaoQuickReply {
  action: 'message' | 'block';
  label: string;
  messageText?: string;
  blockId?: string;
}

export type KakaoOutput = KakaoSimpleText | KakaoBasicCard;

export interface KakaoSkillResponse {
  version: '2.0';
  template: {
    outputs: KakaoOutput[];
    quickReplies?: KakaoQuickReply[];
  };
}
