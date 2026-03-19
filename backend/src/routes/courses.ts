import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

export async function courseRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    const db = getDB();
    const courses = await db.collection("courses").find().toArray();
    return courses;
  });

  fastify.post<{ Body: { title: string; description: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { title, description } = request.body;
      const db = getDB();

      const result = await db.collection("courses").insertOne({ title, description });
      return { id: result.insertedId.toString(), title, description };
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      const course = await db.collection("courses").findOne({ _id: new ObjectId(id) });
      if (!course) return reply.status(404).send({ message: "Course not found" });

      const modules = await db.collection("modules").find({ courseId: id }).toArray();
      
      for (const mod of modules) {
        const videos = await db.collection("videos").find({ moduleId: mod._id.toString() }).toArray();
        (mod as any).videos = videos;
      }

      return { ...course, modules };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      await db.collection("courses").deleteOne({ _id: new ObjectId(id) });
      return { message: "Course deleted" };
    }
  );
}