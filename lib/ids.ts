export function genUid(prefix: string = "uid"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-6);
  return `${prefix}_${ts}${rand}`;
}