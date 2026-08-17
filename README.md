# english-words

영어 단어 놀이터

아이가 책 사진을 찍어 올리면 AI(Claude)가 사진 속 영어 단어를 읽고 뜻·유의어/반의어까지 정리해주고, 카드로 외우고 퀴즈로 확인하는 앱이에요.

## 주요 기능

- **단어 추가**: 책 사진을 올리면 AI가 사진을 직접 읽고, 단어의 기본형(사전형)·품사·아이 눈높이의 쉬운 뜻·유의어·반의어를 자동으로 정리해줘요. 단어를 직접 타이핑해서 물어보는 것도 가능해요.
- **카드**: 단어 카드를 눌러 뒤집으면 뜻과 유의어/반의어가 나와요. 🔊 버튼을 누르면 발음을 들을 수 있어요.
- **테스트**: 방금 새로 등록한 단어만 나오는 "새 단어 테스트"와, 지금까지 모은 모든 단어로 보는 "전체 테스트"가 따로 있어요.
- **단어장**: 등록한 모든 단어를 날짜별로 모아보고, 수정·삭제할 수 있어요.
- **기록**: 연속 학습일, 모은 단어 수, 테스트 점수 변화, 자주 틀리는 단어를 확인해요.

단어 데이터는 기기(브라우저)에 저장돼요. 발음 오디오는 무료 공개 사전 API(dictionaryapi.dev)에서 있으면 가져오고, 없으면 브라우저 음성 합성(TTS)으로 읽어줘요.

## 아키텍처

- **프론트엔드**: React + TypeScript + Vite + Tailwind CSS (정적 사이트)
- **백엔드**: `/api/extract-words`, `/api/word-info` — Vercel 서버리스 함수. Anthropic API(Claude)를 호출해서 사진 속 단어 추출과 단어 뜻 조회를 처리해요.
- API 키(`ANTHROPIC_API_KEY`)는 서버리스 함수 안에서만 쓰이고 브라우저에는 절대 노출되지 않아요.

> ⚠️ **GitHub Pages는 정적 파일만 서빙**하기 때문에 `/api/*` 서버리스 함수가 동작하지 않아요. 사진/단어 추가 기능을 쓰려면 아래처럼 **Vercel로 배포**해야 해요. (화면 UI 자체는 GitHub Pages에서도 볼 수 있지만, 단어 추가는 오류가 나요.)

## 배포 (Vercel)

1. https://vercel.com 에서 이 GitHub 저장소를 Import 해요.
2. 프로젝트 Settings → Environment Variables에서 `ANTHROPIC_API_KEY`를 추가해요. ([console.anthropic.com](https://console.anthropic.com/settings/keys)에서 발급)
3. Deploy를 누르면 끝! 이후 `main` 브랜치에 push할 때마다 자동으로 다시 배포돼요.

## 개발

```bash
npm install
npm run dev      # 프론트엔드만 실행 (AI 기능 테스트는 vercel dev 필요)
npm run build    # 프로덕션 빌드
npm run lint     # 린트 검사
```

`/api` 서버리스 함수까지 로컬에서 테스트하려면 [Vercel CLI](https://vercel.com/docs/cli)로 `vercel dev`를 사용하고, 프로젝트 루트에 `.env.local`을 만들어 `ANTHROPIC_API_KEY`를 넣어주세요(`.env.example` 참고).
