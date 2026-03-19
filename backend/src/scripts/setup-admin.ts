import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/lms";

async function setup() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db();
    
    const adminEmail = "admin@lms.com";
    const adminPassword = "admin123";
    const adminName = "Admin";
    
    const existingAdmin = await db.collection("users").findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await db.collection("users").insertOne({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        approved: true,
        createdAt: new Date()
      });
      
      console.log("Admin user created successfully!");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log("\n⚠️  Please change this password after first login!");
    }
    
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setup();