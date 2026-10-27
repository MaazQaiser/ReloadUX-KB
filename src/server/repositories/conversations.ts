import "server-only";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { conversations } from "@/server/db/schema";
import { conversationSchema, type Conversation, type NewConversation } from "@/schemas/conversation";
import { fromRow, newId } from "./rows";

function toConversation(row: typeof conversations.$inferSelect): Conversation {
  const feedback = row.feedback && { ...row.feedback, at: new Date(row.feedback.at) };
  // A null verdict is a value (the turn had no answer), not an empty column.
  return fromRow(conversationSchema, "conversations", { ...row, feedback }, ["verdict"]);
}

export async function insertConversation(turn: NewConversation): Promise<void> {
  const fields = conversationSchema.omit({ id: true, feedback: true }).parse(turn);
  await (await getDb()).insert(conversations).values({ id: newId(), ...fields });
}

/** Stores a rating on the asker's own turn; null if the turn isn't theirs or doesn't exist. */
export async function setConversationFeedback(
  turnId: string,
  userId: string,
  feedback: { rating: "up" | "down"; note?: string },
): Promise<Conversation | null> {
  const [saved] = await (await getDb())
    .update(conversations)
    .set({ feedback: { ...feedback, at: new Date().toISOString() } })
    .where(and(eq(conversations.turn_id, turnId), eq(conversations.user_id, userId)))
    .returning();
  return saved ? toConversation(saved) : null;
}

export interface AskStats {
  /** Questions per ISO week start (UTC Monday), oldest first. */
  weekly: { week: Date; count: number }[];
  totalQuestions: number;
  ratedAnswers: number;
  thumbsUp: number;
}

/** Counts for the analytics panel over the last `weeks` weeks. Ratings of preview answers are left out. */
export async function getAskStats(weeks: number, now = new Date()): Promise<AskStats> {
  const db = await getDb();
  const since = gte(conversations.created_at, new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000));
  // date_trunc('week') starts weeks on Monday.
  const week = sql`date_trunc('week', ${conversations.created_at} at time zone 'UTC') at time zone 'UTC'`.mapWith(conversations.created_at);
  const [weekly, [totals]] = await Promise.all([
    db.select({ week, count: count() }).from(conversations).where(since).groupBy(week).orderBy(week),
    db
      .select({
        total: count(),
        rated: count(sql`case when not ${conversations.preview} and ${conversations.feedback} is not null then 1 end`),
        up: count(sql`case when not ${conversations.preview} and ${conversations.feedback}->>'rating' = 'up' then 1 end`),
      })
      .from(conversations)
      .where(since),
  ]);
  return {
    weekly,
    totalQuestions: totals?.total ?? 0,
    ratedAnswers: totals?.rated ?? 0,
    thumbsUp: totals?.up ?? 0,
  };
}
