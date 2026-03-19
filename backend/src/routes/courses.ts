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
          studentId: userId,
          courseIds: id,
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

  fastify.get<{ Querystring: { enrolled: string } }>(
    "/enrolled",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const db = getDB();
      const userId = request.user.id;

      const registrations = await db.collection("registrations").find({
        studentId: userId,
        status: "approved"
      }).toArray();

      const courseIds = registrations.flatMap((r: any) => r.courseIds || []);
      const uniqueCourseIds = [...new Set(courseIds)];

      const validIds = uniqueCourseIds.filter(isValidObjectId);
      const courses = await db.collection("courses").find({
        _id: { $in: validIds.map((id: string) => new ObjectId(id)) }
      }).toArray();

      return courses;
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

      await db.collection("courses").deleteOne({ _id: new ObjectId(id) });
      return { message: "Course deleted" };
    }
  );
}