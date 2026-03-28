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

export async function videoRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { moduleId: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any] },
    async (request, reply) => {
      const { moduleId } = request.query;
      const db = getDB();
      
      const videos = await db.collection("videos").find({ moduleId }).toArray();
      return videos;
    }
  );

  fastify.post<{ Body: { moduleId: string; title: string; youtubeUrl: string; duration?: number; description?: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { moduleId, title, youtubeUrl, duration, description } = request.body;
      const db = getDB();

      const result = await db.collection("videos").insertOne({ 
        moduleId, 
        title, 
        youtubeUrl,
        duration: duration || 0,
        description: description || "",
        createdAt: new Date()
      });
      return { id: result.insertedId.toString(), moduleId, title, youtubeUrl, duration };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid video ID" });
      }

      await db.collection("progress").deleteMany({ videoId: id });
      await db.collection("videos").deleteOne({ _id: new ObjectId(id) });
      return { message: "Video and related progress deleted" };
    }
  );
}