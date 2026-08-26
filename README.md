# 시계탑 퍼즐 (clocktower-puzzles)

보드게임 **Blood on the Clocktower**(시계탑에 흐른 피)의 상황 추리 퍼즐을 웹에서 풀 수 있는 사이트.
The Pandemonium Institute와 무관한 비공식 팬 프로젝트입니다.

- 요구사항: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- 아키텍처: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 개발

```bash
npm install
npm run dev    # http://localhost:3000
npm test       # 솔버 단위 테스트 + 전 퍼즐 유일해 검증 (배포 게이트)
```

## 퍼즐 추가

1. `src/data/puzzles/`에 새 TS 파일 작성 (기존 파일 참고), `index.ts`에 등록
2. `npm test`로 유일해 검증 통과 확인
3. push → Vercel 자동 배포
