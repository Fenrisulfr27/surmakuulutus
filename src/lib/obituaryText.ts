/** Imported poems use one newline between nonempty lines. */
export function normalizeImportedPoem(poem: string) {
  return poem.split(/\r\n?|\n/).filter((line) => line.trim().length > 0).join("\n");
}
