// Lightweight, pluggable categorizer hook — deterministic heuristics for now
// Exports `categorize(text, categories)` -> { suggested_category_id, category_path }

function categorize(text, categories) {
  if (!text || !categories || !Array.isArray(categories)) return { suggested_category_id: null, category_path: null };
  const t = text.toLowerCase();
  // simple keyword map: search categories for name tokens
  for (const c of categories) {
    if (!c.name) continue;
    const name = c.name.toLowerCase();
    if (t.includes(name)) {
      // build path up to root
      const path = buildPath(c, categories);
      return { suggested_category_id: c.id, category_path: path };
    }
  }
  return { suggested_category_id: null, category_path: null };
}

function buildPath(cat, categories) {
  // walk parents
  const map = new Map(categories.map(c => [c.id, c]));
  const stack = [];
  let cur = cat;
  while (cur) {
    stack.unshift(cur.name);
    cur = map.get(cur.parent_id);
  }
  return {
    primary: stack[0] || null,
    secondary: stack[1] || null,
    tertiary: stack[2] || null,
    specific: stack[3] || null
  };
}

module.exports = { categorize };
