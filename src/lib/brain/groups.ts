export const GROUP_NAMES = [
  "optic",
  "central",
  "vnc",
  "kenyon",
  "pam",
  "ppl1",
  "ppl2",
  "mbon",
  "sugar",
  "bitter",
  "taste",
  "oa",
  "endo",
  "mn9",
  "motor",
  "olf",
  "other_sensory",
  "desc",
] as const;

export type GroupName = (typeof GROUP_NAMES)[number];

export const GROUP_COUNT = GROUP_NAMES.length;

export const REWARD_GROUPS = new Set([3, 4, 7, 8, 11, 12, 13]);
export const AVERSIVE_GROUPS = new Set([5, 9]);

export const GROUP_LABELS: Record<GroupName, string> = {
  optic: "Optic lobe",
  central: "Central brain",
  vnc: "Ventral nerve cord",
  kenyon: "Kenyon cells",
  pam: "PAM dopamine",
  ppl1: "PPL1 dopamine",
  ppl2: "PPL2 dopamine",
  mbon: "Mushroom-body output",
  sugar: "Sugar GRNs",
  bitter: "Bitter GRNs",
  taste: "Other gustatory",
  oa: "Octopamine",
  endo: "NPF / endocrine",
  mn9: "MN9 (PER)",
  motor: "Motor neurons",
  olf: "Olfactory",
  other_sensory: "Other sensory",
  desc: "Descending",
};
