import { Badge } from "@/components/ui/badge";
import type { TagList } from "@/lib/constants";

interface TagBadgesProps<K extends string> {
  list: TagList<K>;
  values: readonly K[];
  variant?: "secondary" | "outline";
}

export function TagBadges<K extends string>({ list, values, variant = "secondary" }: TagBadgesProps<K>) {
  if (values.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1">
      {values.map((value) => (
        <li key={value}>
          <Badge variant={variant}>{list.labels[value]}</Badge>
        </li>
      ))}
    </ul>
  );
}
