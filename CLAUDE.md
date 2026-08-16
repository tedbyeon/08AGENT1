# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

이 저장소는 일반적인 애플리케이션 코드베이스가 아닙니다 — 소스 코드, 패키지 매니페스트, 빌드 시스템, 린터, 테스트 스위트가 없습니다. **티스토리(Tistory) 블로그 글 작성을 완전 자동화하는 파이프라인을 실험하기 위한 Claude Code 설정**만 담고 있습니다. 실행할 빌드/린트/테스트 명령어는 없습니다.

현재는 파이프라인의 배관(리서치 → 작성 → 이미지 → 발행이 실제로 이어지는지)을 검증하는 실험 단계입니다. 그래서 글 작성 서브에이전트(`write`)는 의도적으로 짧은 분량만 생성하도록 지시되어 있습니다. 실제로 게시할 완성도 높은 콘텐츠는 이 파이프라인이 검증된 뒤 별도로 다시 작성/수정할 예정입니다.

## 블로그 글 작성 파이프라인

파이프라인은 4단계이며, 각 단계는 전용 서브에이전트가 담당하고 이전 단계의 산출물을 입력으로 받아 순차적으로 실행됩니다. 오케스트레이션은 `blog_skill` 스킬이 담당합니다 (스킬 자신은 작업을 직접 수행하지 않고 아래 순서대로 서브에이전트를 호출만 합니다).

```
[트리거: "블로그 글 작성"]
        │
        ▼
1. 리서치 (research 서브에이전트)
   - 주제를 웹 검색으로 조사
   - 산출물: output/01_research.md
        │
        ▼
2. 글 작성 (write 서브에이전트)
   - 01_research.md를 입력으로 블로그 글 초안 작성
   - 이미지 자리에 ![...](IMAGE_PLACEHOLDER) 표시
   - 산출물: output/02_blog_post.md
        │
        ▼
3. 이미지 서치 및 저장 (image_search 서브에이전트)
   - 02_blog_post.md의 키워드로 Unsplash 검색
   - 이미지 다운로드 + 출처 기록
   - 산출물: output/03_images/*.jpg, output/03_images/attribution.md
        │
        ▼
4. 블로그 자동 발행 (publish 서브에이전트)
   - 02_blog_post.md의 IMAGE_PLACEHOLDER를 03_images의 실제 이미지로 치환
   - 티스토리 글쓰기 페이지(마크다운 모드)에 자동 입력 후 공개 발행
   - 산출물: output/04_publish_log.md (발행 URL, 발행 일시, 사용 이미지 목록)
```

### 트리거 조건

다음과 같은 사용자 발화가 있으면 `blog_skill`이 위 1~4단계를 순서대로 자동 실행합니다:
- "블로그 글 작성" / "블로그 글 써줘"
- "블로그 자동화 파이프라인 실행해줘"
- "\<주제\>로 블로그 글 자동으로 써서 올려줘"

트리거 문구와 함께 주제가 주어지면 그 주제로 즉시 진행하고, 주제가 없으면 사용자에게 먼저 주제를 확인합니다. 어느 단계든 실패하면 다음 단계로 넘어가지 않고 어디서 멈췄는지 사용자에게 보고합니다.

## 구조

- `.claude/agents/research.md` — 1단계 서브에이전트. `WebSearch`, `WebFetch`, `Write` 권한. 주제를 리서치해 `output/01_research.md`를 만듭니다.
- `.claude/agents/write.md` — 2단계 서브에이전트. `Read`, `Write` 권한. 리서치 결과로 블로그 글 초안을 작성해 `output/02_blog_post.md`를 만듭니다.
- `.claude/agents/image_search.md` — 3단계 서브에이전트. Playwright 브라우저 도구 + `Bash`(이미지 다운로드) + `Write`/`Read` 권한. Unsplash에서 이미지를 찾아 `output/03_images/`에 저장합니다.
- `.claude/agents/publish.md` — 4단계(최종) 서브에이전트. `Read`/`Write` + Playwright 브라우저 도구 전체(`browser_navigate`, `browser_click`, `browser_type`, `browser_snapshot`, `browser_fill_form`, `browser_take_screenshot`, `browser_handle_dialog`, `browser_tabs`) 권한. 글과 이미지를 결합해 티스토리에 실제로 발행하는, 되돌리기 어려운 외부 행동을 수행하므로 명시적 요청 없이 실행하지 않습니다.
- `.claude/skills/blog_skill/SKILL.md` — `/blog_skill`로 호출 가능한 오케스트레이터 스킬. 트리거 조건과 4단계 파이프라인 순서를 정의합니다.
- `.claude/settings.local.json` — 로컬 권한 설정.
- `output/` — 파이프라인의 완성된 결과물이 쌓이는 곳. `01_research.md`, `02_blog_post.md`, `03_images/`, `04_publish_log.md` 구조를 따릅니다.
- `휴지통/` — 파이프라인 구조 개편으로 더 이상 쓰이지 않게 된 파일을 파일별로 분류해 보관하는 곳(삭제하지 않고 보관). 예: 리서치/작성/이미지/발행이 분리되기 전 하나로 합쳐져 있던 구(舊) 서브에이전트, 파이프라인 실험 목적에 맞지 않는 예전 장문 콘텐츠.
- `.playwright-mcp/` — Playwright MCP 브라우저 세션에서 생성된 임시 산출물(페이지 스냅샷 `.yml`, 콘솔 로그 `.log`). 파이프라인 산출물이 아닌 도구 스크래치 파일입니다.

## 작업 시 참고사항

- 각 서브에이전트의 `TODO` 없는 완성된 지시문을 수정할 때도, 4개 서브에이전트의 책임 경계(리서치/작성/이미지/발행)는 그대로 유지하세요. 한 서브에이전트가 다른 단계의 일까지 하지 않도록 합니다.
- `write` 서브에이전트가 만드는 글 분량은 지금은 의도적으로 짧습니다. 실제 발행용 콘텐츠 품질을 높이는 작업은 이 파이프라인 구조와는 별도로 진행됩니다.
- `publish` 서브에이전트 실행 중 티스토리 지도 캡챠(DKAPTCHA)가 나타날 수 있습니다. 지도 라벨을 읽어 빈칸 글자를 입력해 통과시키되, 판독이 불확실하면 임의로 우회하지 말고 스크린샷을 사용자에게 보여주고 확인을 받으세요.
- **AI는 어떤 사이트에도 자동 로그인을 수행하지 않습니다.** 브라우저 세션이 이미 로그인되어 있다는 전제 하에서만 발행을 진행하며, 로그인 폼(아이디/비밀번호 입력, 로그인 버튼 클릭 등)을 자동으로 채우거나 제출하지 않습니다. 발행 중 로그인 페이지가 감지되면 즉시 진행을 멈추고 사용자에게 직접 로그인해달라고 요청하세요.
