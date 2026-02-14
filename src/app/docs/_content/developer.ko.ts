import type { DeveloperGuideContent } from './types';

const content: DeveloperGuideContent = {
  title: '개발자 가이드',
  description:
    'AskDocs API를 사용하여 AI 챗봇을 애플리케이션에 연동하는 방법을 안내합니다.',
  apiNotice: 'API 접근은 <strong>Pro</strong> 플랜 이상에서 사용 가능합니다.',
  upgradeLinkText: '요금제 업그레이드',
  toc: [
    { id: 'quickstart', label: '1. 빠른 시작' },
    { id: 'authentication', label: '2. 인증' },
    { id: 'code-examples', label: '3. 코드 예제' },
    { id: 'endpoints', label: '4. 엔드포인트 레퍼런스' },
    { id: 'errors', label: '5. 에러 코드 & Rate Limits' },
    { id: 'tips', label: '6. SDK / Webhook 연동 팁' },
  ],
  quickstart: {
    title: '1. 빠른 시작',
    description: '3단계로 첫 API 호출을 완료하세요.',
    steps: [
      {
        title: 'API Key 발급',
        description:
          '<apikeys>대시보드 > API Keys</apikeys>에서 새 API Key를 생성합니다. Key는 <code>ask_</code>로 시작하며, 생성 시 한 번만 표시됩니다.',
      },
      {
        title: '봇 ID 확인',
        description:
          '대시보드에서 연동할 봇의 상세 페이지로 이동하여 Bot ID를 복사합니다. URL에서 확인할 수도 있습니다: <code>/dashboard/bots/[BOT_ID]</code>',
      },
      {
        title: '첫 API 호출',
        description: '',
      },
    ],
  },
  authentication: {
    title: '2. 인증',
    description:
      '모든 API 요청에는 <code>Authorization</code> 헤더에 Bearer 토큰이 필요합니다.',
    managementTitle: 'API Key 관리',
    managementItems: [
      'API Key는 <apikeys>대시보드 > API Keys</apikeys>에서 생성/삭제할 수 있습니다.',
      'Key는 생성 시 한 번만 전체가 표시됩니다. 안전한 곳에 저장하세요.',
      'Key가 유출된 경우 즉시 삭제하고 새로 발급하세요.',
      '환경 변수에 저장하고, 코드에 직접 하드코딩하지 마세요.',
    ],
  },
  codeExamples: {
    title: '3. 코드 예제',
    pythonTitle: 'Python (requests)',
    jsTitle: 'JavaScript / Node.js (fetch)',
    curlTitle: 'cURL',
    streamingTitle: 'Python 스트리밍 (SSE)',
  },
  endpoints: {
    title: '4. 엔드포인트 레퍼런스',
    chat: {
      description: '봇에게 메시지를 보내고 AI 응답을 받습니다.',
      requestBodyTitle: 'Request Body',
      responseTitle: 'Response (stream: false)',
      streamingTitle: 'Streaming (stream: true)',
      streamingDescription: 'Server-Sent Events (SSE) 형식으로 응답합니다.',
    },
    getBot: { description: '봇 정보를 조회합니다.' },
    getConversations: { description: '봇의 대화 목록을 조회합니다.' },
    getMessages: { description: '대화의 전체 메시지를 조회합니다.' },
    getUsage: { description: '현재 사용량과 플랜 제한을 조회합니다.' },
  },
  errors: {
    title: '5. 에러 코드 & Rate Limits',
    errorsTitle: '에러 코드',
    headers: ['Status', '설명'],
    rows: [
      { status: '400', description: '잘못된 요청 (필수 필드 누락, 유효하지 않은 입력)' },
      { status: '401', description: '인증 실패 (API Key 누락 또는 유효하지 않음)' },
      { status: '403', description: '접근 거부 (플랜이 API를 지원하지 않거나 봇 비활성)' },
      { status: '404', description: '리소스를 찾을 수 없음 (봇 또는 대화가 존재하지 않음)' },
      { status: '429', description: 'Rate Limit 초과 또는 메시지 할당량 초과' },
      { status: '500', description: '서버 내부 오류' },
    ],
    errorFormat: '모든 에러 응답 형식: <code>{"success": false, "error": "description"}</code>',
    rateLimitTitle: 'Rate Limits',
    rateLimitHeaders: ['플랜', '제한'],
    rateLimitRows: [
      { plan: 'Pro', limit: '60 requests / minute' },
      { plan: 'Enterprise', limit: '300 requests / minute' },
    ],
    rateLimitNote: 'Rate Limit 관련 헤더: <code>X-RateLimit-Remaining</code>, <code>Retry-After</code>',
  },
  tips: {
    title: '6. SDK / Webhook 연동 팁',
    envTitle: '환경 변수 관리',
    errorHandlingTitle: '에러 핸들링 패턴',
    multiTurnTitle: '대화 이어가기 (Multi-turn)',
    multiTurnDescription:
      '첫 번째 응답에서 받은 <code>conversation_id</code>를 다음 요청에 포함하면 대화를 이어갈 수 있습니다.',
    webhookTitle: 'Webhook 활용',
    webhookDescription:
      'Telegram, 카카오톡 등의 메신저 연동은 Webhook 방식으로 동작합니다. AskDocs가 자동으로 Webhook을 설정하므로 별도의 서버 구성이 필요하지 않습니다.',
    webhookItems: [
      'Telegram: 채널 설정에서 Bot Token 입력 시 자동 Webhook 등록',
      '카카오톡: 카카오 개발자 센터에서 Webhook URL 설정 필요',
      '커스텀 Webhook: REST API를 활용하여 직접 구현 가능',
    ],
  },
};

export default content;
