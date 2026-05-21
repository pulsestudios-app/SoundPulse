import { resolveIncomingDeepLinkPath } from "@/src/lib/appLinking";

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    return resolveIncomingDeepLinkPath(path);
  } catch {
    return initial ? "/" : path;
  }
}
