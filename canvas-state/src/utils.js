export function makeUniqueId(prefix = '') {
  let lastId = 0;
  return () => `${prefix}-${++lastId}`;
}
