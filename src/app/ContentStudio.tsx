import { useEffect, useMemo, useState } from "react";

import {
  applyContentPatch,
  assertContentRegistry,
  buildContentRegistry,
  contentLengthWarning,
  parseContentPatch,
  type ContentRecord,
} from "../presentation/design/contentRegistry";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";

const DRAFT_STORAGE_KEY = "tmr-content-studio-drafts-v1";

function readDrafts(): Readonly<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "{}",
    );
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([id, text]) => typeof id === "string" && typeof text === "string",
      ),
    );
  } catch {
    return {};
  }
}

function categoryLabel(category: ContentRecord["category"]): string {
  switch (category) {
    case "title":
      return "타이틀";
    case "briefing":
      return "브리핑";
    case "hud":
      return "HUD";
    case "event":
      return "사건";
    case "agenda":
      return "의제";
    case "policy":
      return "정책";
    case "intervention":
      return "개입";
    case "project":
      return "사업";
    case "country":
      return "국가";
    case "faction":
      return "세력";
    case "region":
      return "지역";
    case "entity":
      return "개체";
    case "outcome":
      return "결과";
  }
}

export function ContentStudio() {
  const records = useMemo(
    () => buildContentRegistry(GAMEBUILDERS_DEMO_SCENARIO),
    [],
  );
  const [drafts, setDrafts] = useState<Readonly<Record<string, string>>>(() =>
    readDrafts(),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ContentRecord["category"] | "all">(
    "all",
  );
  const [branch, setBranch] = useState("all");
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");
  const [patchText, setPatchText] = useState("");
  const [status, setStatus] = useState("stable ID 콘텐츠를 선택하세요.");

  useEffect(() => {
    assertContentRegistry(records);
  }, [records]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    }
  }, [drafts]);

  const branches = useMemo(
    () => [...new Set(records.map((item) => item.branchOrVariantId))].sort(),
    [records],
  );
  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (branch !== "all" && item.branchOrVariantId !== branch) return false;
      if (normalized.length === 0) return true;
      return [
        item.id,
        item.text,
        item.conditionLabel,
        item.entityId ?? "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [branch, category, query, records]);

  useEffect(() => {
    if (!filteredRecords.some((item) => item.id === selectedId)) {
      setSelectedId(filteredRecords[0]?.id ?? "");
    }
  }, [filteredRecords, selectedId]);

  const selected = records.find((item) => item.id === selectedId) ?? null;
  const selectedText =
    selected === null ? "" : (drafts[selected.id] ?? selected.text);
  const changedRecords = records.filter(
    (item) => drafts[item.id] !== undefined && drafts[item.id] !== item.text,
  );

  const updateSelectedText = (text: string) => {
    if (selected === null) return;
    setDrafts((current) => ({ ...current, [selected.id]: text }));
    setStatus("로컬 초안에 저장했습니다.");
  };

  const exportPatch = () => {
    const patch = {
      version: 1 as const,
      changes: changedRecords.map((item) => ({
        id: item.id,
        text: drafts[item.id] ?? item.text,
      })),
    };
    const json = JSON.stringify(patch, null, 2);
    setPatchText(json);
    setStatus(
      changedRecords.length === 0
        ? "변경된 콘텐츠가 없습니다."
        : `${changedRecords.length}개 변경 patch를 만들었습니다.`,
    );
    if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
      void navigator.clipboard.writeText(json).catch(() => undefined);
    }
  };

  const importPatch = () => {
    try {
      const patch = parseContentPatch(patchText, records);
      const applied = applyContentPatch(records, patch);
      setDrafts(
        Object.fromEntries(
          applied
            .filter(
              (item) =>
                item.text !== records.find((base) => base.id === item.id)?.text,
            )
            .map((item) => [item.id, item.text]),
        ),
      );
      setStatus(`${patch.changes.length}개 patch를 로컬 초안에 불러왔습니다.`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "patch를 불러오지 못했습니다.",
      );
    }
  };

  const resetSelected = () => {
    if (selected === null) return;
    setDrafts((current) => {
      const next = { ...current };
      delete next[selected.id];
      return next;
    });
    setStatus("선택한 초안을 기준 문구로 되돌렸습니다.");
  };

  const resetAll = () => {
    setDrafts({});
    setStatus("모든 로컬 초안을 기준 문구로 되돌렸습니다.");
  };

  const lengthWarning =
    selected === null ? null : contentLengthWarning(selected, selectedText);

  return (
    <main className="content-studio-shell" data-content-studio>
      <header className="studio-header">
        <div>
          <span className="eyebrow">개발용 authoring surface</span>
          <h1>Content Studio</h1>
          <p>stable ID 기반 플레이어 문구 · branch/variant 편집</p>
        </div>
        <a className="studio-back" href="/">
          게임으로 돌아가기
        </a>
      </header>
      <section className="studio-toolbar" aria-label="콘텐츠 검색 필터">
        <label>
          검색
          <input
            value={query}
            placeholder="ID, 문구, entity"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          종류
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as ContentRecord["category"] | "all",
              )
            }
          >
            <option value="all">전체</option>
            {[...new Set(records.map((item) => item.category))]
              .sort()
              .map((value) => (
                <option key={value} value={value}>
                  {categoryLabel(value)}
                </option>
              ))}
          </select>
        </label>
        <label>
          branch / variant
          <select
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
          >
            <option value="all">전체</option>
            {branches.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </section>
      <div className="studio-layout">
        <aside className="studio-record-list" aria-label="stable ID 목록">
          <div className="studio-list-heading">
            <strong>{filteredRecords.length}개 항목</strong>
            <span>{changedRecords.length}개 초안</span>
          </div>
          {filteredRecords.map((item) => (
            <button
              className={
                selectedId === item.id
                  ? "studio-record active"
                  : "studio-record"
              }
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
            >
              <strong>{item.id}</strong>
              <span>{item.text}</span>
              <small>
                {categoryLabel(item.category)} · {item.branchOrVariantId}
              </small>
            </button>
          ))}
        </aside>
        <section className="studio-editor" aria-label="콘텐츠 편집기">
          {selected === null ? (
            <p className="empty-state">검색 결과에서 콘텐츠를 선택하세요.</p>
          ) : (
            <>
              <div className="studio-editor-heading">
                <div>
                  <span className="eyebrow">{selected.conditionLabel}</span>
                  <h2>{selected.id}</h2>
                  <p>
                    {selected.category} · {selected.screen} ·{" "}
                    {selected.branchOrVariantId}
                  </p>
                </div>
                <span className="studio-baseline">
                  baseline {selected.baselineRevision}
                </span>
              </div>
              <label className="studio-text-label">
                플레이어 문구
                <textarea
                  value={selectedText}
                  rows={7}
                  onChange={(event) => updateSelectedText(event.target.value)}
                />
              </label>
              <div className="studio-diff" data-content-diff>
                <div>
                  <span className="eyebrow">기준 문구</span>
                  <p>{selected.text}</p>
                </div>
                <div>
                  <span className="eyebrow">현재 초안</span>
                  <p>{selectedText}</p>
                </div>
              </div>
              {lengthWarning === null ? null : (
                <p className="studio-warning" role="status">
                  {lengthWarning}
                </p>
              )}
              <div className="studio-actions">
                <button type="button" onClick={resetSelected}>
                  선택 항목 초기화
                </button>
                <button type="button" onClick={resetAll}>
                  전체 초기화
                </button>
              </div>
            </>
          )}
          <div className="studio-patch-tools">
            <div className="studio-editor-heading">
              <div>
                <span className="eyebrow">repository handoff</span>
                <h2>JSON patch</h2>
              </div>
              <span className="studio-baseline">GitHub 직접 쓰기 없음</span>
            </div>
            <textarea
              value={patchText}
              rows={9}
              placeholder='{"version":1,"changes":[]}'
              onChange={(event) => setPatchText(event.target.value)}
              aria-label="JSON patch"
            />
            <div className="studio-actions">
              <button type="button" onClick={exportPatch}>
                patch 내보내기 / 복사
              </button>
              <button type="button" onClick={importPatch}>
                patch 불러오기
              </button>
            </div>
            <p className="studio-status" role="status" aria-live="polite">
              {status}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
