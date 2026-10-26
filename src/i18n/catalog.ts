export function compileCatalog(source: Record<string, string>) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => {
    const placeholders: Record<string, { content: string }> = {};
    const message = value.replace(/\$(\d)/g, (_match, position: string) => {
      placeholders['arg' + position] = { content: '$' + position };
      return '$arg' + position + '$';
    });
    return [key, { message, ...(Object.keys(placeholders).length ? { placeholders } : {}) }];
  }));
}
