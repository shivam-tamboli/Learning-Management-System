import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

interface RegistrationBody {
  studentId?: string;
  courseIds: string[];
  step: number;
  data: any;
}

export async function registrationRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const db = getDB();
      const registrations = await db.collection("registrations").find().toArray();
      return registrations;
    }
  );

  fastify.post<{ Body: RegistrationBody }>(
    "/step",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { studentId, courseIds, step, data } = request.body;
      const db = getDB();

      const registrationData: any = {
        studentId,
        courseIds,
        status: "pending",
        createdAt: new Date()
      };

      if (step === 1) registrationData.basicDetails = data;
      else if (step === 2) registrationData.address = data;
      else if (step === 3) registrationData.contact = data;
      else if (step === 4) registrationData.education = data;
      else if (step === 5) registrationData.health = data;

      if (studentId) {
        const existing = await db.collection("registrations").findOne({ studentId: new ObjectId(studentId) });
        if (existing) {
          const updateField: string = `step${step}Data`;
          await db.collection("registrations").updateOne(
            { _id: existing._id },
            { $set: { [updateField]: data } }
          );
          return { message: "Step data updated", id: existing._id.toString() };
        }
      }

      const result = await db.collection("registrations").insertOne(registrationData);
      return { id: result.insertedId.toString(), message: "Registration started" };
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
      if (!registration) return reply.status(404).send({ message: "Registration not found" });
      return registration;
    }
  );

  fastify.post<{ Params: { id: string }; Body: { action: string } }>(
    "/:id/status",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { action } = request.body;
      const db = getDB();

      if (action === "approve") {
        const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
        
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const userEmail = registration?.basicDetails?.firstName?.toLowerCase() + "." + 
          registration?.basicDetails?.lastName?.toLowerCase() + "@student.lms";

        const userResult = await db.collection("users").insertOne({
          name: `${registration?.basicDetails?.firstName} ${registration?.basicDetails?.lastName}`,
          email: userEmail,
          password: hashedPassword,
          role: "student",
          approved: true
        });

        await db.collection("registrations").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "approved", userId: userResult.insertedId.toString(), credentials: { email: userEmail, password: randomPassword } } }
        );

        return { message: "Student approved", credentials: { email: userEmail, password: randomPassword } };
      } else if (action === "reject") {
        await db.collection("registrations").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "rejected" } }
        );
        return { message: "Student rejected" };
      }

      return { message: "Invalid action" };
    }
  );
}