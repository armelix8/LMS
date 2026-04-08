import { getUserProfileSnapshotSafe } from "@/lib/user-profile-db";

export type UserProfileSnapshot = {
  name: string | null;
  headline: string | null;
};

/** Node-only: fresh name/headline from DB (JWT may be stale after profile edit). */
export async function getUserProfileSnapshot(
  userId: string,
): Promise<UserProfileSnapshot> {
  return getUserProfileSnapshotSafe(userId);
}
