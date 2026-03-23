import { getDB } from "../db/index.js";

const DRAFT_EXPIRY_DAYS = 7;

export async function cleanupExpiredDrafts(): Promise<number> {
  const db = getDB();
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - DRAFT_EXPIRY_DAYS);
  
  const result = await db.collection("registrations").deleteMany({
    status: "draft",
    createdAt: {
      $lt: expiryDate
    }
  });
  
  console.log(`Cleaned up ${result.deletedCount} expired draft registrations`);
  return result.deletedCount;
}

export async function setupDraftTTLIndex(): Promise<void> {
  const db = getDB();
  
  try {
    await db.collection("registrations").createIndex(
      { createdAt: 1 },
      { 
        expireAfterSeconds: DRAFT_EXPIRY_DAYS * 24 * 60 * 60,
        partialFilterExpression: { status: "draft" }
      }
    );
    console.log("TTL index for draft cleanup created/verified");
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log("TTL index already exists with different options, skipping...");
    } else {
      throw error;
    }
  }
}
