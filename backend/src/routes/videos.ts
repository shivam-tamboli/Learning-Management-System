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

  fastify.post<{ Body: { moduleId: string; title: string; youtubeUrl: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { moduleId, title, youtubeUrl } = request.body;
      const db = getDB();

      const result = await db.collection("videos").insertOne({ moduleId, title, youtubeUrl });
      return { id: result.insertedId.toString(), moduleId, title, youtubeUrl };
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