import type { HubContent } from './types';

const content: HubContent = {
  title: 'Documentation',
  description:
    'AskDocs를 시작하는 데 필요한 모든 정보를 확인하세요. 웹사이트 사용법부터 API 연동까지 안내합니다.',
  userGuide: {
    title: '사용자 가이드',
    description:
      '회원가입, 봇 생성, 지식 추가, 채널 연결까지 AskDocs 웹사이트 사용법을 단계별로 안내합니다.',
    link: '가이드 보기',
  },
  developerGuide: {
    title: '개발자 가이드',
    description:
      'API Key 발급, Python/JavaScript 코드 예제, 엔드포인트 레퍼런스 등 API 연동에 필요한 모든 정보.',
    link: 'API 문서 보기',
  },
  quickLinks: {
    title: '빠른 링크',
    items: [
      { href: '/docs/user-guide#getting-started', label: '시작하기', description: '회원가입 및 로그인' },
      { href: '/docs/user-guide#create-bot', label: '봇 만들기', description: '첫 번째 챗봇 생성' },
      { href: '/docs/user-guide#add-knowledge', label: '지식 추가', description: 'PDF, 웹페이지, Q&A' },
      { href: '/docs/user-guide#channels', label: '채널 연결', description: '웹 위젯, 텔레그램, 카카오톡' },
      { href: '/docs/developer#quickstart', label: 'API 빠른 시작', description: '3단계로 첫 API 호출' },
      { href: '/docs/developer#code-examples', label: '코드 예제', description: 'Python, JavaScript, cURL' },
      { href: '/docs/developer#endpoints', label: '엔드포인트 레퍼런스', description: '전체 API 엔드포인트' },
      { href: '/docs/developer#errors', label: '에러 코드', description: '에러 코드 및 Rate Limits' },
    ],
  },
};

export default content;
