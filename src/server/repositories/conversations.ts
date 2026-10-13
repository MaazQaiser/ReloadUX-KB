import "server-only";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { conversationSchema, type Conversation, type NewConversation } from "@/schemas/conversation";
import { fromDocument, toObjectId } from "./mongo";

async function conversations() {
  return (await getDb()).collection(COLLECTIONS.conversations);
}

export async function insertConversation(turn: NewConversation): Promise<void> {
  const { user_id, ...rest } = conversationSchema.omit({ id: true, feedback: true }).parse(turn);
  await (await conversations()).insertOne({ ...rest, user_id: toObjectId(user_id) });
}

/** Stores a rating on the asker's own turn; null if the turn isn't theirs or doesn't exist. */
export async function setConversationFeedback(
  turnId: string,
  userId: string,
  feedback: { rating: "up" | "down"; note?: string },
): Promise<Conversation | null> {
  const saved = await (await conversations()).findOneAndUpdate(
    { turn_id: turnId, user_id: toObjectId(userId) },
    { $set: { feedback: { ...feedback, at: new Date() } } },
    { returnDocument: "after" },
  );
  return saved ? fromDocument(conversationSchema, COLLECTIONS.conversations, { ...saved, user_id: saved.user_id.toHexString() }) : null;
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
  const since = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  const [weekly, totals] = await Promise.all([
    (await conversations())
      .aggregate<{ _id: Date; count: number }>([
        { $match: { created_at: { $gte: since } } },
        { $group: { _id: { $dateTrunc: { date: "$created_at", unit: "week", startOfWeek: "monday" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    (await conversations())
      .aggregate<{ total: number; rated: number; up: number }>([
        { $match: { created_at: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            rated: { $sum: { $cond: [{ $and: [{ $ne: ["$preview", true] }, { $ifNull: ["$feedback", false] }] }, 1, 0] } },
            up: { $sum: { $cond: [{ $and: [{ $ne: ["$preview", true] }, { $eq: ["$feedback.rating", "up"] }] }, 1, 0] } },
          },
        },
      ])
      .toArray(),
  ]);
  const summary = totals[0] ?? { total: 0, rated: 0, up: 0 };
  return {
    weekly: weekly.map((row) => ({ week: row._id, count: row.count })),
    totalQuestions: summary.total,
    ratedAnswers: summary.rated,
    thumbsUp: summary.up,
  };
}
