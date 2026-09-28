/** Resolve bundled public files both locally and under a GitHub Pages subpath. */
export function publicUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
