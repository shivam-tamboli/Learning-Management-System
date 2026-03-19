import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/lms";
const client = new MongoClient(uri);

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  
  try {
    await client.connect();
    db = client.db();
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) throw new Error("Database not connected");
  return db;
}