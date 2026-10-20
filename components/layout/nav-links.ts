export function isActivePath(pathname: string | null, path: string) {
  if (!pathname) return false;
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}
