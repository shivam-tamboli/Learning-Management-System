import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

export async function progressRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { courseId: string } }>(
    "/:courseId",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { courseId } = request.params;
      const userId = request.user.id;
      const db = getDB();

      const progress = await db.collection("progress").find({
        studentId: userId,
        courseId
      }).toArray();

      return progress;
    }
  );

  fastify.post<{ Body: { courseId: string; videoId: string } }>(
    "/complete",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { courseId, videoId } = request.body;
      const userId = request.user.id;
      const db = getDB();

      if (request.user.role !== "student" || !request.user.approved) {
        return reply.status(403).send({ message: "Access denied" });
      }

      const registration = await db.collection("registrations").findOne({
        studentId: userId,
        courseIds: courseId
      });

      if (!registration) {
        return reply.status(403).send({ message: "Not enrolled in this course" });
      }

      const existing = await db.collection("progress").findOne({
        studentId: userId,
        courseId,
        videoId
      });

      if (existing) {
        return { message: "Already marked complete", progress: existing };
      }

      const result = await db.collection("progress").insertOne({
        studentId: userId,
        courseId,
        videoId,
        isCompleted: true,
        completedAt: new Date()
      });

      const totalProgress = await db.collection("progress").countDocuments({
        studentId: userId,
        courseId,
        isCompleted: true
      });

      const totalVideos = await db.collection("videos").countDocuments({});

      return {
        message: "Video marked complete",
        progress: { id: result.insertedId.toString(), courseId, videoId, isCompleted: true },
        percentage: Math.round((totalProgress / totalVideos) * 100)
      };
    }
  );

  fastify.get<{ Querystring: { studentId?: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { studentId } = request.query;
      const db = getDB();

      const query = studentId ? { studentId } : {};
      const progress = await db.collection("progress").find(query).toArray();
      return progress;
    }
  );
}