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

export async function courseRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] }, async (request, reply) => {
    const db = getDB();
    const courses = await db.collection("courses").find().toArray();
    return courses;
  });

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { id } = request.params;
      const db = getDB();
      const userId = request.user.id;
      const isAdmin = request.user.role === "admin";

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid course ID" });
      }

      const course = await db.collection("courses").findOne({ _id: new ObjectId(id) });
      if (!course) return reply.status(404).send({ message: "Course not found" });

      if (!isAdmin) {
        const registration = await db.collection("registrations").findOne({
          userId: userId,
          courseIds: { $in: [id] },
          status: "approved"
        });
        
        if (!registration) {
          return reply.status(403).send({ message: "Not enrolled in this course" });
        }
      }

      const modules = await db.collection("modules").find({ courseId: id }).toArray();
      
      for (const mod of modules) {
        const videos = await db.collection("videos").find({ moduleId: mod._id.toString() }).toArray();
        (mod as any).videos = videos;
      }

      return { ...course, modules };
    }
  );

  fastify.get(
    "/enrolled",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const db = getDB();
      const userId = request.user.id;

      const registrations = await db.collection("registrations").find({
        userId: userId,
        status: "approved"
      }).toArray();

      const courseIds = registrations.flatMap((r: any) => r.courseIds || []);
      const uniqueCourseIds = [...new Set(courseIds)];
      const validIds = uniqueCourseIds.filter(isValidObjectId);

      if (validIds.length === 0) {
        return [];
      }

      const courses = await db.collection("courses").find({
        _id: { $in: validIds.map((id: string) => new ObjectId(id)) }
      }).toArray();

      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const courseIdStr = course._id.toString();
          
          const modules = await db.collection("modules").find({ courseId: courseIdStr }).toArray();
          const moduleIds = modules.map((m: any) => m._id.toString());
          
          const totalVideos = moduleIds.length > 0
            ? await db.collection("videos").countDocuments({ moduleId: { $in: moduleIds } })
            : 0;

          const courseProgress = await db.collection("course_progress").findOne({
            studentId: userId,
            courseId: courseIdStr
          });

          const completedVideos = courseProgress?.completedVideos || 0;
          const totalWatchTime = courseProgress?.totalWatchTime || 0;
          const progress = courseProgress?.overallProgress || 0;

          return {
            _id: course._id.toString(),
            title: course.title,
            description: course.description || "",
            totalVideos,
            completedVideos,
            totalWatchTime,
            progress
          };
        })
      );

      return coursesWithProgress;
    }
  );

  fastify.post<{ Body: { title: string; description: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { title, description } = request.body;
      const db = getDB();

      const result = await db.collection("courses").insertOne({ 
        title, 
        description,
        createdAt: new Date()
      });
      return { id: result.insertedId.toString(), title, description };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid course ID" });
      }

      const modules = await db.collection("modules").find({ courseId: id }).toArray();
      const moduleIds = modules.map((m: any) => m._id.toString());

      if (moduleIds.length > 0) {
        const videos = await db.collection("videos").find({ moduleId: { $in: moduleIds } }).toArray();
        const videoIds = videos.map((v: any) => v._id.toString());

        if (videoIds.length > 0) {
          await db.collection("progress").deleteMany({ videoId: { $in: videoIds } });
        }

        await db.collection("videos").deleteMany({ moduleId: { $in: moduleIds } });
      }

      await db.collection("modules").deleteMany({ courseId: id });
      await db.collection("courses").deleteOne({ _id: new ObjectId(id) });
      return { message: "Course and all related data deleted" };
    }
  );
}