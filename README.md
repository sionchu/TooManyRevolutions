# 내 왕국에 혁명이 너무 많다
**Working Title:** 《내 왕국에 혁명이 너무 많다》  
**Project Codename:** `TooManyRevolutions`


브라우저에서 플레이하는 빠른 템포의 판타지 정치·사회 시뮬레이션.

플레이어는 특정 왕이나 정권이 아니라 **한 국가의 역사적 연속성**을 플레이한다.  
법과 제도를 바꾸고 시간을 가속하면 시민·정치세력·외국이 적응한다. 정치사상은 국경을 넘어 퍼지고, 개혁은 반란·쿠데타·혁명·전쟁·새로운 체제로 이어질 수 있다.

## 한 문장

> 붕괴 직전의 판타지 국가를 맡아 새로운 질서를 정착시켜라. 정권이 무너져도 국가는 살아남는 한 게임은 계속된다.

## 핵심 승패

**승리**
- 충분한 지역이 안정화되어 있고,
- 수도와 국가 핵심 기능을 통제하며,
- 내전/붕괴 상태가 해소되고,
- 일정 기간 새로운 질서를 유지한다.

**패배**
- 국가가 독립된 정치 공동체로 더 이상 존속하지 못한다.
- 완전 병합, 중앙국가의 영구 분열, 실질적 주권 소멸 등이 해당한다.

혁명, 쿠데타, 정권교체, 선거 패배, 왕조 멸망은 자동 Game Over가 아니다.

## 시작 전 필독

Codex와 인간 개발자는 다음 순서로 읽는다.

1. [`AGENTS.md`](./AGENTS.md)
2. [`docs/GDD.md`](./docs/GDD.md)
3. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
4. 작업에 따라 [`docs/QA_PLAYTEST.md`](./docs/QA_PLAYTEST.md), [`docs/REFERENCES.md`](./docs/REFERENCES.md)

## 개발 순서

1. Project Foundation
2. Headless Simulation
3. Headless Fun Gate
4. Graybox World UX
5. Agent AI Proof
6. Diorama Art
7. Responsive / Performance / Competition Polish

최종 아트는 Headless Fun Gate 전에 시작하지 않는다.

## 기본 기술 방향

- Vite
- React
- TypeScript
- Three.js + React Three Fiber
- WebGL 우선
- WebGPU는 progressive enhancement
- DOM UI + responsive CSS
- OpenAI Agent 호출은 브라우저에서 직접 하지 않고 서버/서버리스 경유
- seeded deterministic simulation
- event log + snapshot + replay

## 문서 역할

| 문서 | 역할 |
|---|---|
| `AGENTS.md` | Codex가 반드시 지켜야 할 규칙 |
| `docs/GDD.md` | 게임 디자인 Source of Truth |
| `docs/ARCHITECTURE.md` | 기술/데이터/런타임 구조 |
| `docs/QA_PLAYTEST.md` | 버그 QA와 재미 검증 기준 |
| `docs/REFERENCES.md` | 외부 Git/MCP/연구 프레임워크 |
| `docs/DECISIONS.md` | 되돌리기 비싼 결정 기록 |
| `docs/CODEX_DEVLOG.md` | Codex 활용 및 구현 이력 |
| `docs/BACKLOG.md` | Gate 기반 구현 순서 |
| `CODEX_KICKOFF.md` | 첫 Codex 실행 지시 |
