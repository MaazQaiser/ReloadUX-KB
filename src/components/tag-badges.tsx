import { Badge } from "@/components/ui/badge";
import { tagLabel, type CatalogList } from "@/lib/tag-catalog";

interface TagBadgesProps {
  list: CatalogList;
  values: readonly string[];
  variant?: "secondary" | "outline";
}

export function TagBadges({ list, values, variant = "secondary" }: TagBadgesProps) {
  if (values.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1">
      {values.map((value) => (
        <li key={value}>
          <Badge variant={variant}>{tagLabel(list, value)}</Badge>
        </li>
      ))}
    </ul>
  );
}
