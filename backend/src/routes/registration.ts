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

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
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

      if (step === 1 && courseIds && courseIds.length > 0) {
        const registrationData: any = {
          courseIds,
          status: "pending",
          createdAt: new Date(),
          basicDetails: data
        };

        const result = await db.collection("registrations").insertOne(registrationData);
        return { id: result.insertedId.toString(), message: "Registration started" };
      }

      if (studentId && isValidObjectId(studentId)) {
        const existing = await db.collection("registrations").findOne({ _id: new ObjectId(studentId) });
        
        if (!existing) {
          return reply.status(404).send({ message: "Registration not found" });
        }

        const updateData: any = {};
        
        if (step === 2) updateData.address = data;
        else if (step === 3) updateData.contact = data;
        else if (step === 4) updateData.education = data;
        else if (step === 5) updateData.health = data;

        if (Object.keys(updateData).length > 0) {
          await db.collection("registrations").updateOne(
            { _id: new ObjectId(studentId) },
            { $set: updateData }
          );
        }

        return { message: "Step data saved", id: studentId };
      }

      return reply.status(400).send({ message: "Invalid request. Step 1 requires courseIds, other steps require studentId" });
    }
  );

  fastify.put<{ Params: { id: string }; Body: { studentId?: string } }>(
    "/:id/student",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { studentId } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

      await db.collection("registrations").updateOne(
        { _id: new ObjectId(id) },
        { $set: { userId: studentId } }
      );

      return { message: "Student linked to registration" };
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

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

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

      if (action === "approve") {
        const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
        
        if (!registration) {
          return reply.status(404).send({ message: "Registration not found" });
        }

        const firstName = registration.basicDetails?.firstName || "Student";
        const lastName = registration.basicDetails?.lastName || "";
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const userEmail = registration.basicDetails?.email || 
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.lms`;

        const existingUser = await db.collection("users").findOne({ email: userEmail });
        if (existingUser) {
          return reply.status(400).send({ message: "User with this email already exists" });
        }

        const userResult = await db.collection("users").insertOne({
          name: `${firstName} ${lastName}`.trim(),
          email: userEmail,
          password: hashedPassword,
          role: "student",
          approved: true,
          createdAt: new Date()
        });

        await db.collection("registrations").updateOne(
          { _id: new ObjectId(id) },
          { $set: { 
            status: "approved", 
            userId: userResult.insertedId.toString(), 
            credentials: { email: userEmail, password: randomPassword },
            approvedAt: new Date()
          }}
        );

        return { 
          message: "Student approved and credentials generated", 
          credentials: { email: userEmail, password: randomPassword },
          userId: userResult.insertedId.toString()
        };
      } else if (action === "reject") {
        await db.collection("registrations").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "rejected", rejectedAt: new Date() } }
        );
        return { message: "Student rejected" };
      }

      return reply.status(400).send({ message: "Invalid action" });
    }
  );
}