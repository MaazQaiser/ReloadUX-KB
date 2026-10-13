import { Badge } from "@/components/ui/badge";

/** Marks screens that show canned data until their backend is built, so nobody trusts it. */
export function PreviewBadge() {
  return (
    <Badge variant="outline" title="This screen shows sample data until its backend is built.">
      Preview data
    </Badge>
  );
}
