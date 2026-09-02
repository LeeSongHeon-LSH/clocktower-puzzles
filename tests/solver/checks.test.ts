import { describe, expect, it } from "vitest";
import { checkContent } from "@/lib/solver/roles";
import type { RoleId } from "@/lib/solver/types";
import { makeCtx } from "./helpers";

const POOL: RoleId[] = [
  "imp", "spy", "poisoner", "baron", "scarletwoman", "recluse",
  "washerwoman", "librarian", "investigator", "chef", "empath",
  "fortuneteller", "undertaker", "ravenkeeper", "drunk",
];

describe("세탁부", () => {
  const assignment: RoleId[] = ["washerwoman", "spy", "imp", "empath", "chef"];
  const ctx = makeCtx({ assignment, rolePool: POOL });
  it("실제 마을 주민을 가리키면 참", () => {
    expect(checkContent(ctx, 0, { type: "washerwoman", targets: [1, 3], shownRole: "empath" }, 1)).toBe(true);
  });
  it("첩자는 마을 주민 역할로 오등록될 수 있다", () => {
    expect(checkContent(ctx, 0, { type: "washerwoman", targets: [1, 2], shownRole: "librarian" }, 1)).toBe(true);
  });
  it("임프만으로는 마을 주민 역할을 보일 수 없다", () => {
    expect(checkContent(ctx, 0, { type: "washerwoman", targets: [2, 2], shownRole: "librarian" }, 1)).toBe(false);
  });
});

describe("사서", () => {
  it("주정뱅이가 있으면 '외지인 없음'은 거짓", () => {
    const ctx = makeCtx({
      assignment: ["librarian", "drunk", "imp", "empath", "chef", "spy"],
      rolePool: POOL,
      claims: [{ seat: 1, role: "empath", info: [] }],
    });
    expect(checkContent(ctx, 0, { type: "librarian", targets: null }, 1)).toBe(false);
    expect(checkContent(ctx, 0, { type: "librarian", targets: [1, 2], shownRole: "drunk" }, 1)).toBe(true);
  });
  it("은둔자만 있으면 '외지인 없음'이 가능 (하수인 오등록)", () => {
    const ctx = makeCtx({
      assignment: ["librarian", "recluse", "imp", "empath", "chef", "spy"],
      rolePool: POOL,
    });
    expect(checkContent(ctx, 0, { type: "librarian", targets: null }, 1)).toBe(true);
  });
  it("오등록이 없는 외지인이 있으면 '외지인 없음'은 거짓", () => {
    // 집사·성자는 은둔자와 달리 다른 것으로 등록될 수 없다 — 사서는 그를 보았어야 한다
    for (const outsider of ["butler", "saint", "moonchild"] as RoleId[]) {
      const ctx = makeCtx({
        assignment: ["librarian", outsider, "imp", "empath", "chef", "spy"],
        rolePool: [...POOL, "butler", "saint", "moonchild"],
        claims: [{ seat: 1, role: outsider, info: [] }],
      });
      expect(checkContent(ctx, 0, { type: "librarian", targets: null }, 1), outsider).toBe(false);
    }
  });
});

describe("초공감자", () => {
  it("이웃의 필수 악·유동 악을 구간으로 판정한다", () => {
    const ctx = makeCtx({ assignment: ["empath", "imp", "chef", "washerwoman", "spy"], rolePool: POOL });
    // 이웃: 좌석 1(임프, 필수 악), 좌석 4(첩자, 유동)
    expect(checkContent(ctx, 0, { type: "empath", count: 0 }, 1)).toBe(false);
    expect(checkContent(ctx, 0, { type: "empath", count: 1 }, 1)).toBe(true);
    expect(checkContent(ctx, 0, { type: "empath", count: 2 }, 1)).toBe(true);
  });
  it("죽은 좌석은 건너뛰고 이웃을 찾는다", () => {
    const ctx = makeCtx({
      assignment: ["empath", "imp", "chef", "washerwoman", "fortuneteller"],
      rolePool: POOL,
      nights: 2,
      events: [{ type: "death", night: 2, seat: 1 }],
    });
    // 밤2: 좌석1 사망 → 이웃은 좌석 4와 좌석 2 (선인들) → 0명
    expect(checkContent(ctx, 0, { type: "empath", count: 0 }, 2)).toBe(true);
    expect(checkContent(ctx, 0, { type: "empath", count: 1 }, 2)).toBe(false);
  });
});

describe("요리사", () => {
  it("첩자의 등록 선택에 따라 0 또는 1쌍", () => {
    const ctx = makeCtx({ assignment: ["imp", "spy", "chef", "washerwoman", "empath"], rolePool: POOL });
    expect(checkContent(ctx, 2, { type: "chef", count: 0 }, 1)).toBe(true);
    expect(checkContent(ctx, 2, { type: "chef", count: 1 }, 1)).toBe(true);
    expect(checkContent(ctx, 2, { type: "chef", count: 2 }, 1)).toBe(false);
  });
});

describe("점쟁이", () => {
  const assignment: RoleId[] = ["fortuneteller", "imp", "recluse", "empath", "chef"];
  it("데몬 토큰은 강제 '있음'", () => {
    const ctx = makeCtx({ assignment, rolePool: POOL, redHerring: 3 });
    expect(checkContent(ctx, 0, { type: "fortuneteller", targets: [1, 4], yes: true }, 1)).toBe(true);
    expect(checkContent(ctx, 0, { type: "fortuneteller", targets: [1, 4], yes: false }, 1)).toBe(false);
  });
  it("레드 헤링도 강제 '있음'", () => {
    const ctx = makeCtx({ assignment, rolePool: POOL, redHerring: 3 });
    expect(checkContent(ctx, 0, { type: "fortuneteller", targets: [3, 4], yes: true }, 1)).toBe(true);
    expect(checkContent(ctx, 0, { type: "fortuneteller", targets: [3, 4], yes: false }, 1)).toBe(false);
  });
  it("은둔자는 양쪽 다 가능", () => {
    const ctx = makeCtx({ assignment, rolePool: POOL, redHerring: 3 });
    expect(checkContent(ctx, 0, { type: "fortuneteller", targets: [2, 4], yes: true }, 1)).toBe(true);
    expect(checkContent(ctx, 0, { type: "fortuneteller", targets: [2, 4], yes: false }, 1)).toBe(true);
  });
});

describe("장의사", () => {
  it("죽은 은둔자도 악역으로 오등록될 수 있다", () => {
    const ctx = makeCtx({
      assignment: ["undertaker", "recluse", "imp", "empath", "chef", "washerwoman", "spy"],
      rolePool: POOL,
      nights: 2,
      events: [{ type: "execution", day: 1, seat: 1 }],
    });
    expect(checkContent(ctx, 0, { type: "undertaker", shownRole: "recluse" }, 2)).toBe(true);
    expect(checkContent(ctx, 0, { type: "undertaker", shownRole: "imp" }, 2)).toBe(true);
    expect(checkContent(ctx, 0, { type: "undertaker", shownRole: "empath" }, 2)).toBe(false);
  });
});
