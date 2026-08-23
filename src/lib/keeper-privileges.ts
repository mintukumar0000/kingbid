import { KEEPER_LEVELS, type KeeperLevel } from "@/lib/keepers";

export type KeeperLevelInfo = {
  level: KeeperLevel;
  label: string;
  emoji: string;
  privilege: string;
  howToEarn: string;
};

export const KEEPER_LEVEL_INFO: KeeperLevelInfo[] = [
  {
    level: "observer",
    label: "Observer",
    emoji: "👀",
    privilege: "Browse rooms and follow activity.",
    howToEarn: "Visit any room — you're in.",
  },
  {
    level: "member",
    label: "Member",
    emoji: "🎫",
    privilege: "Nominate 1 product on your Discovery list.",
    howToEarn: "Add 1 Discovery bet on /founders.",
  },
  {
    level: "scout",
    label: "Scout",
    emoji: "🔭",
    privilege: "Nominate up to 10 products · Kingmaker score starts climbing.",
    howToEarn: "3 Discovery list picks.",
  },
  {
    level: "keeper",
    label: "Keeper",
    emoji: "🏰",
    privilege: "Curate 1 approved room · request community rooms.",
    howToEarn: "Curate 1 active room + Kingbid Score ≥ 20.",
  },
  {
    level: "senior_keeper",
    label: "Senior Keeper",
    emoji: "⚔️",
    privilege: "Up to 3 rooms · pin listings · run weekly room events.",
    howToEarn: "3 active rooms + Score ≥ 50.",
  },
  {
    level: "legendary_keeper",
    label: "Legendary Keeper",
    emoji: "👑",
    privilege: "Propose official categories · global spotlight nominations.",
    howToEarn: "5 active rooms + Score ≥ 100.",
  },
];

export function keeperLevelLabel(level: string): string {
  return KEEPER_LEVEL_INFO.find((k) => k.level === level)?.label ?? level.replace(/_/g, " ");
}

export function keeperLevelRank(level: string): number {
  const idx = KEEPER_LEVELS.indexOf(level as KeeperLevel);
  return idx >= 0 ? idx : 0;
}

export const ROOM_SCARCITY_RULES = [
  { type: "Category rooms", rule: "Official — synced from KingBid categories, admin-approved." },
  { type: "Community rooms", rule: "Request via /rooms/request — needs Score ≥ 30 or admin approval." },
  { type: "Geographic rooms", rule: "Require relevance note; nested under parent when approved." },
  { type: "Sponsored rooms", rule: "Companies may sponsor visibility — never control rank." },
];
