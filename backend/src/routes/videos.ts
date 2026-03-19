import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

export async function videoRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { moduleId: string } }>(
    "/",
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

      await db.collection("videos").deleteOne({ _id: new ObjectId(id) });
      return { message: "Video deleted" };
    }
  );
}