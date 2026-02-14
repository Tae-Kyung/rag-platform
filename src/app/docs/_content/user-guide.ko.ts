import type { UserGuideContent } from './types';

const content: UserGuideContent = {
  title: '사용자 가이드',
  description:
    'AskDocs를 사용하여 AI 챗봇을 만들고 배포하는 방법을 단계별로 안내합니다.',
  toc: [
    { id: 'getting-started', label: '1. 시작하기' },
    { id: 'create-bot', label: '2. 봇 만들기' },
    { id: 'add-knowledge', label: '3. 지식 추가' },
    { id: 'channels', label: '4. 채널 연결' },
    { id: 'conversations', label: '5. 대화 관리' },
    { id: 'billing', label: '6. 요금제 & 결제' },
  ],
  gettingStarted: {
    title: '1. 시작하기',
    signupTitle: '회원가입',
    signupSteps: [
      '<signup>회원가입 페이지</signup>에 접속합니다.',
      '이메일과 비밀번호를 입력하고 "Sign Up" 버튼을 클릭합니다.',
      '이메일 인증 링크를 확인하고 클릭하면 가입이 완료됩니다.',
    ],
    loginTitle: '로그인 & 대시보드',
    loginDescription:
      '로그인하면 <strong>대시보드</strong>로 이동합니다. 대시보드에서 봇 관리, 문서 업로드, 채널 설정, 사용량 확인 등 모든 기능에 접근할 수 있습니다.',
    tip: '<strong>Tip:</strong> 무료 플랜으로 시작하면 봇 1개, 문서 10개, 월 100건의 메시지를 사용할 수 있습니다.',
  },
  createBot: {
    title: '2. 봇 만들기',
    steps: [
      '대시보드에서 <strong>"새 봇 만들기"</strong> 버튼을 클릭합니다.',
      '봇 이름과 설명을 입력합니다. (예: "고객 지원 봇", "FAQ 도우미")',
      '<strong>시스템 프롬프트</strong>를 설정합니다. 시스템 프롬프트는 봇의 성격과 답변 스타일을 결정합니다.',
      '"생성" 버튼을 클릭하면 봇이 생성됩니다.',
    ],
    promptTitle: '시스템 프롬프트 예시',
    promptExample: `당신은 친절한 고객 지원 담당자입니다.
제공된 문서를 기반으로 정확하게 답변하세요.
답변을 모를 경우 솔직하게 모른다고 말하세요.
한국어로 응답하세요.`,
    settingsTitle: '봇 설정 옵션',
    settings: [
      { name: '봇 이름', description: '사용자에게 표시되는 봇의 이름' },
      { name: '설명', description: '봇의 용도를 설명하는 짧은 문구' },
      { name: '시스템 프롬프트', description: '봇의 성격, 답변 스타일, 언어 등을 지정' },
      { name: 'AI 모델', description: 'GPT-4o-mini (기본), GPT-4o (Pro 이상)' },
    ],
  },
  addKnowledge: {
    title: '3. 지식 추가',
    description:
      '봇이 답변할 수 있도록 지식 문서를 추가합니다. AskDocs는 세 가지 방법을 지원합니다.',
    pdfTitle: 'PDF 업로드',
    pdfSteps: [
      '봇 상세 페이지에서 <strong>"문서"</strong> 탭을 선택합니다.',
      '"PDF 업로드" 버튼을 클릭하고 파일을 선택합니다.',
      '업로드가 완료되면 자동으로 텍스트 추출, 청킹, 임베딩이 진행됩니다.',
    ],
    crawlTitle: '웹페이지 크롤링',
    crawlSteps: [
      '"URL 추가" 버튼을 클릭합니다.',
      '크롤링할 웹페이지 URL을 입력합니다.',
      'AskDocs가 자동으로 페이지 내용을 가져와 지식으로 저장합니다.',
    ],
    qaTitle: 'Q&A 쌍 추가',
    qaSteps: [
      '"Q&A 추가" 버튼을 클릭합니다.',
      '질문과 답변을 직접 입력합니다.',
      '자주 묻는 질문에 대한 정확한 답변을 보장할 수 있습니다.',
    ],
    note: '<strong>참고:</strong> 문서가 처리되는 데 수 초~수 분이 소요될 수 있습니다. 처리가 완료되면 상태가 "완료"로 변경됩니다.',
  },
  channels: {
    title: '4. 채널 연결',
    description:
      '봇을 다양한 채널에 연결하여 사용자와 소통할 수 있습니다.',
    widgetTitle: '웹 위젯 임베드',
    widgetDescription:
      '웹사이트에 채팅 위젯을 추가하여 방문자가 봇과 대화할 수 있습니다.',
    widgetSteps: [
      '봇 상세 페이지에서 <strong>"채널"</strong> 탭을 선택합니다.',
      '"웹 위젯" 섹션에서 임베드 코드를 복사합니다.',
      '웹사이트의 <code>&lt;/body&gt;</code> 태그 앞에 코드를 붙여넣습니다.',
    ],
    telegramTitle: '텔레그램 봇 연결',
    telegramSteps: [
      'Telegram에서 <strong>@BotFather</strong>와 대화하여 새 봇을 생성합니다.',
      'BotFather가 제공하는 <strong>Bot Token</strong>을 복사합니다.',
      'AskDocs 채널 설정에서 Telegram 토큰을 입력하고 연결합니다.',
      'Webhook이 자동으로 설정되며, 즉시 사용 가능합니다.',
    ],
    kakaoTitle: '카카오톡 연결',
    kakaoSteps: [
      '<kakao>카카오 개발자 센터</kakao>에서 애플리케이션을 생성합니다.',
      '채널 관리자 센터에서 카카오톡 채널을 생성합니다.',
      'AskDocs에서 카카오 App Key와 채널 정보를 입력하여 연결합니다.',
    ],
    kakaoOpenBuilderTitle: '카카오 i 오픈빌더 스킬 설정',
    kakaoOpenBuilderSteps: [
      '<openbuilder>카카오 i 오픈빌더</openbuilder>에 접속하여 봇을 선택합니다.',
      '<strong>스킬</strong> 메뉴에서 스킬을 생성하고, 스킬 서버 URL에 AskDocs에서 제공하는 Webhook URL을 붙여넣습니다.',
      '<strong>시나리오 → 폴백 블록</strong>을 선택하고, 봇 응답에서 "스킬데이터 사용"을 체크한 뒤 생성한 스킬을 연결합니다.',
      '<strong>배포</strong> 탭에서 "배포하기"를 클릭합니다.',
      '카카오톡에서 채널을 친구 추가한 뒤 메시지를 전송하여 정상 동작을 테스트합니다.',
    ],
    kakaoNote: '<strong>참고:</strong> 카카오톡 채널은 Pro 또는 Enterprise 플랜에서 사용할 수 있습니다. 오픈빌더 스킬은 동기식 응답 기준 <strong>5초 타임아웃</strong> 제한이 있으며, simpleText 응답은 최대 <strong>1,000자</strong>까지 지원됩니다.',
    whatsappTitle: 'WhatsApp 연결',
    whatsappSteps: [
      '<metadev>Meta Developer Console</metadev>에서 WhatsApp Business 앱을 생성합니다.',
      'WhatsApp &gt; API Setup에서 <strong>Phone Number ID</strong>와 <strong>Access Token</strong>을 확인합니다.',
      'AskDocs 채널 설정에서 Phone Number ID와 Access Token을 입력하고 연결합니다.',
      '연결 후 제공되는 <strong>Webhook URL</strong>과 <strong>Verify Token</strong>을 Meta 앱의 Webhook 설정에 등록합니다.',
      'Webhook 필드에서 <strong>messages</strong>를 구독하면 메시지 수신이 시작됩니다.',
    ],
    whatsappNote: '<strong>참고:</strong> WhatsApp 채널은 Pro 또는 Enterprise 플랜에서 사용할 수 있습니다. WhatsApp Cloud API의 텍스트 메시지는 최대 <strong>4,096자</strong>까지 지원됩니다.',
  },
  conversations: {
    title: '5. 대화 관리',
    monitorTitle: '대화 내역 모니터링',
    monitorDescription:
      '대시보드의 <strong>"대화"</strong> 탭에서 모든 대화 내역을 확인할 수 있습니다. 각 대화의 채널(웹, 텔레그램, API 등), 언어, 메시지 수 등을 확인할 수 있습니다.',
    analyticsTitle: '분석 대시보드',
    analyticsItems: [
      '일별/월별 메시지 수 추이',
      '채널별 사용 비중',
      '인기 질문 및 응답 품질 지표',
      '문서별 참조 빈도',
    ],
  },
  billing: {
    title: '6. 요금제 & 결제',
    comparisonTitle: '요금제 비교',
    headers: ['기능', 'Free', 'Pro', 'Enterprise'],
    rows: [
      { feature: '봇 수', free: '1개', pro: '10개', enterprise: '무제한' },
      { feature: '문서 수', free: '10개', pro: '500개', enterprise: '무제한' },
      { feature: '월 메시지', free: '100건', pro: '10,000건', enterprise: '무제한' },
      { feature: '저장 용량', free: '50MB', pro: '5GB', enterprise: '무제한' },
      { feature: 'API 접근', free: '-', pro: 'O', enterprise: 'O' },
      { feature: 'AI 모델', free: 'GPT-4o-mini', pro: 'GPT-4o', enterprise: 'GPT-4o + Claude' },
    ],
    upgradeTitle: '업그레이드 방법',
    upgradeSteps: [
      '대시보드에서 <strong>"Billing"</strong> 메뉴로 이동합니다.',
      '원하는 요금제를 선택하고 "업그레이드"를 클릭합니다.',
      'Paddle을 통해 안전하게 결제를 완료합니다.',
    ],
    note: '<strong>참고:</strong> 요금제에 대한 자세한 내용은 <pricing>요금제 페이지</pricing>를 확인하세요.',
  },
};

export default content;
