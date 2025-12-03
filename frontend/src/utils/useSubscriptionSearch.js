import Fuse from "fuse.js";

export function useSubscriptionSearch(subscriptions, searchTerm, parseCost) {
  if (!searchTerm.trim()) {
    return subscriptions.map((sub) => ({ ...sub, _matches: [] }));
  }

  const query = searchTerm.trim();
  let filtered = [...subscriptions];

  const costMatch = query.match(/^(\$)?\s*(<=?|>=?)?\s*(\d+(\.\d+)?)/);
  if (costMatch) {
    const operator = costMatch[2] || "=";
    const num = parseFloat(costMatch[3]);

    filtered = filtered.filter((sub) => {
      const cost = parseCost(sub.cost);
      if (operator === "<") return cost < num;
      if (operator === "<=") return cost <= num;
      if (operator === ">") return cost > num;
      if (operator === ">=") return cost >= num;
      return Math.abs(cost - num) < 0.01;
    });
  }

  if (!costMatch) {
    const fuse = new Fuse(filtered, {
      includeMatches: true,
      includeScore: true,
      threshold: 0.4,
      keys: [
        { name: "name", weight: 0.5 },
        { name: "status", weight: 0.2 },
        { name: "frequency", weight: 0.1 },
        { name: "card_issuer", weight: 0.1 },
        { name: "cardIssuer", weight: 0.1 }
      ]
    });

    const results = fuse.search(query);
    filtered = results.map((r) => ({
      ...r.item,
      _matches: r.matches
    }));
  }

  return filtered;
}
