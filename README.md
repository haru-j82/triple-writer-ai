# 트리플로그 AI (TripleWriter AI) — 데모 클론 프로젝트

알파블로그(alphablogogo.com) 사이트를 분석해 만든 **기능 클론 데모**입니다.
브랜드명·로고·카피·회사정보는 저작권/상표 문제를 피하기 위해 전부 새로 만들었고
(회사정보는 예시용 가짜 값입니다), 실제 사이트와 동일한 화면 구성·워크플로우를
최대한 정밀하게 재현했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속. (다른 프로젝트와 포트가 겹치면
`npm run dev -- -p 3010` 처럼 포트를 지정하세요.)

## 구현된 것 / 안 된 것

| 영역 | 상태 |
|---|---|
| 랜딩 페이지 (네비/히어로/문제제기/통합에이전트/장점/작동방식탭/요금제/FAQ/전체푸터) | ✅ 완성 |
| 좌우 플로팅 위젯 (광고문의 / 포토스튜디오 AI) | ✅ 구조 재현 (로그인 후 노출) |
| Google 로그인 | ⚠️ 모의(mock) 로그인 — 실제 OAuth 미연동 |
| 에이전트 모드 4단계 위저드 (진행 배너·서브단계 포함) | ✅ 완성 |
| 실제 AI 생성 (ChatGPT/Claude/Gemini) | ⚠️ **모의 생성** — `lib/mockAI.ts` 템플릿 기반 |
| 대량 생성 모드 (아코디언 결과: 부제목/메타디스크립션/발췌문/키워드/태그/해시태그/글구조) | ✅ 완성 |
| 대시보드 (구독/보너스 크레딧 구분, 배치 단위 최근 글 목록) | ✅ 완성 |
| 프로필 (계정정보/결제내역/사용내역) | ✅ 완성 |
| 요금제 페이지 + 크레딧 차감/지급 로직 | ✅ 완성 (결제는 시뮬레이션) |
| 파일 업로드 파싱 | ⚠️ 파일 선택 UI만, 실제 내용 파싱 미구현 |
| 결제(PG) 연동 | ❌ 미구현 (다음 단계) |

## 실제 서비스로 전환하려면

1. **AI 연동**: `lib/mockAI.ts`의 `generateDraft`, `analyzeDraft`, `synthesizeFinal`,
   `lib/bulkTemplates.ts`의 `generateBulkDetail` 내부를 OpenAI / Gemini / Anthropic
   API 호출로 교체하세요. 컴포넌트 쪽은 시그니처만 유지하면 수정이 필요 없습니다.
2. **인증**: `lib/store.tsx`의 `loginWithGoogle`을 NextAuth.js 등 실제 OAuth로 교체.
3. **DB**: 현재 모든 상태는 브라우저 `localStorage`에만 저장됩니다. Postgres/Supabase 등으로 이전 필요.
4. **결제**: 토스페이먼츠/이니시스 등 PG 연동 필요.
5. **파일 파싱**: `mammoth`(docx), `xlsx`, `papaparse`(csv), HWP는 `pyhwp`/`hwp5` 검토.

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · React Context + localStorage

## 품질 체크

`npm run build` 타입체크 통과, `npx eslint .` 0 errors, 7개 라우트 전부 200 확인 완료.
