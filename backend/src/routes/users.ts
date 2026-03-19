import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

export async function userRoutes(fastify: FastifyInstance) {
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
      
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } }
      );
      
      if (!user) return reply.status(404).send({ message: "User not found" });
      return user;
    }
  );

  fastify.put<{ Params: { id: string }; Body: { approved: boolean } }>(
    "/:id/approve",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { approved } = request.body;
      const db = getDB();

      await db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { $set: { approved } }
      );

      return { message: `User ${approved ? "approved" : "rejected"}` };
    }
  );
}