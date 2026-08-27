// 2026-08-27 5차 확장: No Dashii — 데몬의 양방향 가장 가까운 마을 사람 둘이 계속 중독.
// 밤별 "중독돼 있었을 수 있는 좌석" 집합(간격 추상화)의 계산과 소비를 검증하고,
// 마지막 통합 테스트는 8개 후보 세계를 손으로 전수 도출한 퍼즐로 유일해 도출을 증명한다.

import { describe, expect, it } from "vitest";
import { solve } from "@/lib/solver/solve";
import { Schedule, demonScenarios } from "@/lib/solver/timeline";
import { checkContent } from "@/lib/solver/roles";
import type { RoleId, SolverPuzzle } from "@/lib/solver/types";
import { makeCtx, makePuzzle } from "./helpers";

describe("노 다시: 중독 가능 집합 계산", () => {
  it("외지인·하수인은 건너뛰고, 첩자는 흡수 가능성으로 함께 든다", () => {
    // 0 노 다시 — 시계방향: 1 첩자(흡수 ∃, 계속) → 2 공감술사(주민, 정지).
    // 반시계방향: 6 점쟁이(주민, 정지). → {1, 2, 6}
    const assignment: RoleId[] = ["nodashii", "spy", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({ assignmentLength: 7, rolePool: ["nodashii", "spy"], nights: 1 });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect([...scs[0].nodashiiPoisoned![1]].sort()).toEqual([1, 2, 6]);
  });

  it("중독된 이웃이 죽으면 독이 다음 주민에게 옮겨 갈 수 있다", () => {
    const assignment: RoleId[] = ["nodashii", "empath", "chef", "scarletwoman", "librarian", "washerwoman", "fortuneteller"];
    const pz = makePuzzle({
      assignmentLength: 7, rolePool: ["nodashii", "scarletwoman"], nights: 2,
      events: [{ type: "death", night: 2, seat: 1 }], // 중독돼 있던 이웃(1)이 밤2에 죽는다
    });
    const scs = demonScenarios(pz, new Schedule(pz), assignment);
    expect(scs.length).toBeGreaterThan(0);
    expect([...scs[0].nodashiiPoisoned![1]].sort()).toEqual([1, 6]); // 밤1: 양옆 첫 주민
    expect([...scs[0].nodashiiPoisoned![2]].sort()).toEqual([1, 2, 6]); // 밤2: 죽기 전(1)과 옮겨 간 뒤(2) 합집합
  });

  it("중독된 이웃 군인의 죽음은 독살범 없이 설명되고, 이웃이 아니면 안 된다", () => {
    const neighbor: RoleId[] = ["nodashii", "soldier", "empath", "chef", "librarian", "washerwoman", "fortuneteller"];
    const pzN = makePuzzle({
      assignmentLength: 7, rolePool: ["nodashii", "scarletwoman"], nights: 2,
      events: [{ type: "death", night: 2, seat: 1 }],
    });
    expect(demonScenarios(pzN, new Schedule(pzN), neighbor).length).toBeGreaterThan(0);

    // 군인(3)이 이웃 주민(1, 6)의 그늘 밖이면 그의 죽음을 설명할 독이 없다
    const far: RoleId[] = ["nodashii", "empath", "chef", "soldier", "librarian", "washerwoman", "fortuneteller"];
    const pzF = makePuzzle({
      assignmentLength: 7, rolePool: ["nodashii", "scarletwoman"], nights: 2,
      events: [{ type: "death", night: 2, seat: 3 }],
    });
    expect(demonScenarios(pzF, new Schedule(pzF), far).length).toBe(0);
  });
});

describe("노 다시: 수학자 간격 집계", () => {
  it("중독 가능 좌석은 min에는 안 들고 max에만 든다", () => {
    const ctx = makeCtx({
      assignment: ["nodashii", "empath", "mathematician", "chef", "librarian", "washerwoman", "scarletwoman"],
      rolePool: ["nodashii", "scarletwoman"],
      poison: [null, null],
    });
    ctx.sc.nodashiiPoisoned = [new Set(), new Set([1])]; // 밤1: 공감술사(1)가 중독 가능
    expect(checkContent(ctx, 2, { type: "mathematician", count: 0 }, 1)).toBe(true); // 독이 첩자·비활성으로 샜을 수도
    expect(checkContent(ctx, 2, { type: "mathematician", count: 1 }, 1)).toBe(true); // 공감술사가 실제로 중독
    expect(checkContent(ctx, 2, { type: "mathematician", count: 2 }, 1)).toBe(false);
  });
});

describe("노 다시: 유일해 통합 (후보 세계 전수 수기 도출)", () => {
  // 7인, 독살범 없음. 요리사 주장이 (1, 5)에, 세탁부 주장이 (2, 6)에 중복돼 있어
  // 실물 토큰 중복 금지에 의해 악역 2인은 반드시 {1,5}에서 하나 + {2,6}에서 하나다 → 후보 8개.
  //
  //   의도한 세계: 악역 {5(탕녀), 6(노 다시)} — 노 다시의 독은 {0(공감술사), 4(사서)}.
  //     · 공감술사(0)의 "악한 이웃 0명"은 실제로는 거짓(이웃 6이 데몬)이지만 독으로 설명된다.
  //     · 요리사(1) 1쌍 참(5-6 인접), 세탁부(2) "[1,3] 중 요리사" 참, 점쟁이(3) 두 밤 참, 사서(4) 참.
  //     · 밤2 희생자는 요리사(1) — 독의 사슬(0, 4) 밖이라 죽어도 독이 옮겨 가지 않는다.
  //       (처음에 희생자를 2로 뒀더니 {1,6}·데몬1 세계에서 세탁부(2)의 죽음이 독을 점쟁이(3)로
  //        옮겨 점쟁이 정보가 무제약이 되는 두 번째 세계가 생겼다 — 솔버가 수기 도출보다 정확했다.)
  //   기각 도출 (각 세계에서 멀쩡한 좌석의 거짓 정보 → 독살범 부재로 모순):
  //     · {5,6} 데몬5: 독 {0,4}. 점쟁이 밤2 [4,5] "없음"이 데몬 5 때문에 강제 거짓 → 기각.
  //     · {1,2} 데몬1: 데몬(1)이 밤2에 죽어 탕녀(2)가 승계. 독 {0,3}. 요리사(5)의 "0쌍"이
  //       거짓(1-2 인접 1쌍) → 기각.
  //     · {1,2} 데몬2: 독 {0,3}. 위와 같음 → 기각.
  //     · {1,6} 데몬1: 데몬 사망 → 탕녀(6) 승계. 독 {0,2}. 점쟁이 밤1 [5,6] "있음"은 레드 헤링
  //       5로만 설명되는데 그러면 밤2 [4,5] "없음"이 거짓 → 기각.
  //     · {1,6} 데몬6: 독 {0,5}. 세탁부(2)의 "[1,3] 중 요리사"가 거짓(1=탕녀, 3=점쟁이) → 기각.
  //     · {5,2} 데몬5: 독 {4,6}. 요리사(1)의 "1쌍"이 거짓(2와 5는 비인접, 0쌍) → 기각.
  //     · {5,2} 데몬2: 독 {1,3}(밤2엔 1의 죽음으로 0까지 확장). 세탁부(6)의 "[1,3] 중
  //       세탁부"가 거짓 → 기각.
  const pz: SolverPuzzle = makePuzzle({
    assignmentLength: 7,
    rolePool: ["nodashii", "scarletwoman", "empath", "chef", "washerwoman", "fortuneteller", "librarian"],
    nights: 2,
    events: [{ type: "death", night: 2, seat: 1 }],
    claims: [
      {
        seat: 0, role: "empath", info: [
          { night: 1, data: { type: "empath", count: 0 } },
          { night: 2, data: { type: "empath", count: 0 } },
        ],
      },
      { seat: 1, role: "chef", info: [{ night: 1, data: { type: "chef", count: 1 } }] },
      { seat: 2, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 3], shownRole: "chef" } }] },
      {
        seat: 3, role: "fortuneteller", info: [
          { night: 1, data: { type: "fortuneteller", targets: [5, 6], yes: true } },
          { night: 2, data: { type: "fortuneteller", targets: [4, 5], yes: false } },
        ],
      },
      { seat: 4, role: "librarian", info: [{ night: 1, data: { type: "librarian", targets: null } }] },
      { seat: 5, role: "chef", info: [{ night: 1, data: { type: "chef", count: 0 } }] },
      { seat: 6, role: "washerwoman", info: [{ night: 1, data: { type: "washerwoman", targets: [1, 3], shownRole: "washerwoman" } }] },
    ],
  });

  it("유일해를 정확히 찾는다 — 독살범 없이 노 다시의 독만으로", () => {
    const worlds = solve(pz);
    expect(worlds).toHaveLength(1);
    const w = worlds[0];
    expect(w.assignment).toEqual(["empath", "chef", "washerwoman", "fortuneteller", "librarian", "scarletwoman", "nodashii"]);
    expect(w.currentDemonSeat).toBe(6);
    expect(w.poisonTargets.every((t) => t === null)).toBe(true); // 독살범의 독이 아니라 노 다시의 독
    expect(w.sweetheartDrunk).toBeNull();
  });
});
