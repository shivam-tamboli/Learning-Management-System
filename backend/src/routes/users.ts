import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: string;
  approved?: boolean;
}

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateUserBody }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { name, email, password, role, approved } = request.body;
      const db = getDB();

      const existing = await db.collection("users").findOne({ email });
      if (existing) {
        return reply.status(400).send({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await db.collection("users").insertOne({
        name,
        email,
        password: hashedPassword,
        role: role || "student",
        approved: approved ?? false,
        createdAt: new Date()
      });

      return {
        id: result.insertedId.toString(),
        name,
        email,
        role: role || "student",
        approved: approved ?? false
      };
    }
  );

  fastify.get(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request: any, reply) => {
      const db = getDB();
      const users = await db.collection("users")
        .find({}, { projection: { password: 0 } })
        .toArray();
      return users;
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { id } = request.params;
      const db = getDB();
      
      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid user ID" });
      }

      const user = await db.collection("users").findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } }
      );
      
      if (!user) return reply.status(404).send({ message: "User not found" });
      return user;
    }
  );

  fastify.put<{ Params: { id: string }; Body: { approved?: boolean; isApproved?: boolean } }>(
    "/:id/approve",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { approved, isApproved } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid user ID" });
      }

      const approvedValue = approved ?? isApproved ?? false;

      await db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { $set: { approved: approvedValue, isApproved: approvedValue } }
      );

      return { message: `User ${approvedValue ? "approved" : "rejected"}` };
    }
  );

  fastify.put<{ Params: { id: string }; Body: { name?: string; email?: string; role?: string; approved?: boolean; isApproved?: boolean } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { name, email, role, approved, isApproved } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid user ID" });
      }

      if (email) {
        const existing = await db.collection("users").findOne({ email, _id: { $ne: new ObjectId(id) } });
        if (existing) {
          return reply.status(400).send({ message: "Email already exists" });
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (approved !== undefined) updateData.approved = approved;
      if (isApproved !== undefined) updateData.isApproved = isApproved;

      await db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return { message: "User updated successfully" };
    }
  );
}