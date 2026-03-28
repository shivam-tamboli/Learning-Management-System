import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

async function updateCourseProgress(db: any, studentId: string, courseId: string) {
  const modules = await db.collection("modules").find({ courseId }).toArray();
  const moduleIds = modules.map((m: any) => m._id.toString());
  
  const totalVideos = moduleIds.length > 0
    ? await db.collection("videos").countDocuments({ moduleId: { $in: moduleIds } })
    : 0;

  const studentProgress = await db.collection("progress").find({
    studentId,
    courseId
  }).toArray();

  const completedVideos = studentProgress.filter((p: any) => p.isCompleted).length;
  const totalWatchTime = studentProgress.reduce((sum: number, p: any) => sum + (p.watchTime || 0), 0);

  const courseVideos = moduleIds.length > 0
    ? await db.collection("videos").find({ moduleId: { $in: moduleIds } }).toArray()
    : [];
  const requiredWatchTime = courseVideos.reduce((sum: number, v: any) => sum + (v.duration || 0), 0);

  const videoProgress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
  const watchProgress = requiredWatchTime > 0 ? Math.min((totalWatchTime / requiredWatchTime) * 100, 100) : 0;
  const overallProgress = Math.round(videoProgress * 0.7 + watchProgress * 0.3);

  await db.collection("course_progress").updateOne(
    { studentId, courseId },
    {
      $set: {
        totalVideos,
        completedVideos,
        totalWatchTime,
        requiredWatchTime,
        overallProgress,
        status: overallProgress >= 100 ? "completed" : "in_progress",
        lastAccessedAt: new Date()
      },
      $setOnInsert: { enrolledAt: new Date() }
    },
    { upsert: true }
  );
}

export async function progressRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { courseId: string } }>(
    "/:courseId",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { courseId } = request.params;
      const userId = request.user.id;
      const db = getDB();

      const registration = await db.collection("registrations").findOne({
        userId: userId,
        courseIds: { $in: [courseId] },
        status: "approved"
      });

      if (!registration) {
        return reply.status(403).send({ message: "Not enrolled in this course or registration not approved" });
      }

      const progress = await db.collection("progress").find({
        studentId: userId,
        courseId
      }).toArray();

      return progress;
    }
  );

  fastify.post<{ Body: { courseId: string; videoId: string; watchedTime: number; totalDuration: number } }>(
    "/video/watch",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { courseId, videoId, watchedTime, totalDuration } = request.body;
      const userId = request.user.id;
      const db = getDB();

      const registration = await db.collection("registrations").findOne({
        userId: userId,
        courseIds: { $in: [courseId] },
        status: "approved"
      });

      if (!registration) {
        return reply.status(403).send({ message: "Not enrolled in this course" });
      }

      const completionPercentage = totalDuration > 0 ? Math.round((watchedTime / totalDuration) * 100) : 0;
      const isCompleted = completionPercentage >= 90;

      const existing = await db.collection("progress").findOne({
        studentId: userId,
        courseId,
        videoId
      });

      if (!existing) {
        await db.collection("progress").insertOne({
          studentId: userId,
          courseId,
          videoId,
          videoDuration: totalDuration,
          watchTime: watchedTime,
          completionPercentage,
          isCompleted,
          startedAt: new Date(),
          lastWatchedAt: new Date(),
          lastPlayheadPosition: watchedTime,
          completedAt: isCompleted ? new Date() : undefined
        });
      } else {
        const newWatchTime = Math.max(existing.watchTime || 0, watchedTime);
        const newCompletion = totalDuration > 0 ? Math.round((newWatchTime / totalDuration) * 100) : 0;
        const newIsCompleted = newCompletion >= 90 || existing.isCompleted;

        await db.collection("progress").updateOne(
          { _id: existing._id },
          {
            $set: {
              watchTime: newWatchTime,
              completionPercentage: newCompletion,
              isCompleted: newIsCompleted,
              lastWatchedAt: new Date(),
              lastPlayheadPosition: watchedTime,
              completedAt: newIsCompleted && !existing.completedAt ? new Date() : existing.completedAt
            }
          }
        );
      }

      await updateCourseProgress(db, userId, courseId);

      const courseProgress = await db.collection("course_progress").findOne({ studentId: userId, courseId });

      return reply.send({
        message: "Watch progress recorded",
        completionPercentage,
        isCompleted,
        courseProgress: courseProgress?.overallProgress || 0
      });
    }
  );

  fastify.get<{ Params: { courseId: string } }>(
    "/course/:courseId",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { courseId } = request.params;
      const userId = request.user.id;
      const db = getDB();

      const courseProgress = await db.collection("course_progress").findOne({
        studentId: userId,
        courseId
      });

      if (!courseProgress) {
        return reply.status(404).send({ message: "No progress found for this course" });
      }

      return courseProgress;
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
        userId: userId,
        courseIds: { $in: [courseId] },
        status: "approved"
      });

      if (!registration) {
        return reply.status(403).send({ message: "Not enrolled in this course or registration not approved" });
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
        completionPercentage: 100,
        completedAt: new Date(),
        startedAt: new Date(),
        lastWatchedAt: new Date()
      });

      await updateCourseProgress(db, userId, courseId);

      const courseProgress = await db.collection("course_progress").findOne({ studentId: userId, courseId });

      return {
        message: "Video marked complete",
        progress: { id: result.insertedId.toString(), courseId, videoId, isCompleted: true },
        overallProgress: courseProgress?.overallProgress || 0
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