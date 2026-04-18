export function newId(): string {
  return crypto.randomUUID();
}

export function nowStamps() {
  const now = new Date();
  return { createdAt: now, updatedAt: now };
}
