import { generateIdentity, type Member, memberSchema } from "@kresliarska/shared";

const IDENTITY_KEY = "kresliarska.identity";

const readStoredIdentity = (storage: Storage): Member | undefined => {
  const stored = storage.getItem(IDENTITY_KEY);
  if (!stored) {
    return undefined;
  }
  try {
    const parsed = memberSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

export const saveIdentity = (identity: Member, storage: Storage = localStorage): void => {
  storage.setItem(IDENTITY_KEY, JSON.stringify(identity));
};

export const loadOrCreateIdentity = (storage: Storage = localStorage): Member => {
  const stored = readStoredIdentity(storage);
  if (stored) {
    return stored;
  }
  const identity: Member = { clientId: crypto.randomUUID(), ...generateIdentity() };
  saveIdentity(identity, storage);
  return identity;
};
