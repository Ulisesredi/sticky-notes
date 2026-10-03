export const NOTE_COLORS = [
  { name: "Butter", value: "#f9e9a2" },
  { name: "Peach", value: "#ffd4b8" },
  { name: "Rose", value: "#f7cbd7" },
  { name: "Lavender", value: "#ded2f5" },
  { name: "Sky", value: "#c8e3fa" },
  { name: "Mint", value: "#c8ebda" },
  { name: "Sage", value: "#dce6bd" },
  { name: "Sand", value: "#eadcc7" },
] as const;

export type NoteColor = typeof NOTE_COLORS[number]["value"];
