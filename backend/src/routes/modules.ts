import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export async function moduleRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { courseId: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any] },
    async (request, reply) => {
      const { courseId } = request.query;
      const db = getDB();
      
      const modules = await db.collection("modules").find({ courseId }).toArray();
      return modules;
    }
  );

  fastify.post<{ Body: { courseId: string; title: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { courseId, title } = request.body;
      const db = getDB();

      const result = await db.collection("modules").insertOne({ courseId, title });
      return { id: result.insertedId.toString(), courseId, title };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid module ID" });
      }

      await db.collection("modules").deleteOne({ _id: new ObjectId(id) });
      return { message: "Module deleted" };
    }
  );
}