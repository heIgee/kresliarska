const ADJECTIVES = [
  "Brave",
  "Calm",
  "Clever",
  "Cosmic",
  "Curious",
  "Fuzzy",
  "Gentle",
  "Happy",
  "Jolly",
  "Lucky",
  "Mighty",
  "Nimble",
  "Quiet",
  "Sleepy",
  "Swift",
  "Witty",
] as const;

const ANIMALS = [
  "Badger",
  "Beaver",
  "Falcon",
  "Fox",
  "Hedgehog",
  "Koala",
  "Lynx",
  "Moose",
  "Otter",
  "Owl",
  "Panda",
  "Raccoon",
  "Seal",
  "Stork",
  "Walrus",
  "Wolf",
] as const;

export const IDENTITY_COLORS = [
  "#e11d48",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0284c7",
  "#4f46e5",
  "#9333ea",
  "#db2777",
  "#65a30d",
] as const;

const pick = <T>(items: readonly T[], random: () => number): T => {
  const item = items[Math.floor(random() * items.length) % items.length];
  if (item === undefined) {
    throw new Error("Cannot pick from an empty list");
  }
  return item;
};

export const generateIdentity = (
  random: () => number = Math.random,
): { name: string; color: string } => ({
  name: `${pick(ADJECTIVES, random)} ${pick(ANIMALS, random)}`,
  color: pick(IDENTITY_COLORS, random),
});
