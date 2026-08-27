// 정보 타입 → 콘텐츠 체커 레지스트리.
// 구조적 검증(깨어날 수 있었는가)은 ctx.wakes()가 공통 담당하고,
// 여기는 "술 취하지도 중독되지도 않았을 때 그 정보가 참일 수 있는가"만 판정한다.

import type { Ctx } from "../ctx";
import type { InfoData, Seat } from "../types";
import { washerwoman } from "./washerwoman";
import { librarian } from "./librarian";
import { investigator } from "./investigator";
import { chef } from "./chef";
import { empath } from "./empath";
import { fortuneteller } from "./fortuneteller";
import { undertaker } from "./undertaker";
import { ravenkeeper } from "./ravenkeeper";
import { clockmaker } from "./clockmaker";
import { seamstress } from "./seamstress";
import { juggler } from "./juggler";
import { mathematician } from "./mathematician";
import { chambermaid } from "./chambermaid";
import { monk } from "./monk";
import { exorcist } from "./exorcist";
import { dreamer } from "./dreamer";
import { oracle } from "./oracle";
import { grandmother } from "./grandmother";

export function checkContent(ctx: Ctx, seat: Seat, data: InfoData, night: number): boolean {
  switch (data.type) {
    case "washerwoman": return washerwoman(ctx, seat, data, night);
    case "librarian": return librarian(ctx, seat, data, night);
    case "investigator": return investigator(ctx, seat, data, night);
    case "chef": return chef(ctx, seat, data, night);
    case "empath": return empath(ctx, seat, data, night);
    case "fortuneteller": return fortuneteller(ctx, seat, data, night);
    case "undertaker": return undertaker(ctx, seat, data, night);
    case "ravenkeeper": return ravenkeeper(ctx, seat, data, night);
    case "clockmaker": return clockmaker(ctx, seat, data);
    case "seamstress": return seamstress(ctx, seat, data, night);
    case "juggler": return juggler(ctx, seat, data, night);
    case "mathematician": return mathematician(ctx, seat, data, night);
    case "chambermaid": return chambermaid(ctx, seat, data, night);
    case "monk": return monk(ctx, seat, data, night);
    case "exorcist": return exorcist(ctx, seat, data, night);
    case "dreamer": return dreamer(ctx, seat, data, night);
    case "oracle": return oracle(ctx, seat, data, night);
    case "grandmother": return grandmother(ctx, seat, data, night);
  }
}
