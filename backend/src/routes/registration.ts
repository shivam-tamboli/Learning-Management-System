import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

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

  fastify.post<{ Body: { studentId?: string; courseIds?: string[]; step: number; data: any } }>(
    "/step",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { studentId, courseIds, step, data } = request.body;
      const db = getDB();

      if (step === 1 && courseIds && courseIds.length > 0) {
        const email = data?.email?.trim?.();
        
        if (email) {
          const existingRegistration = await db.collection("registrations").findOne({
            "basicDetails.email": email,
            status: { $in: ["pending", "approved"] }
          });
          
          if (existingRegistration) {
            return reply.status(400).send({ 
              message: `A registration with email ${email} already exists (${existingRegistration.status}). Please use a different email or reject the existing registration first.`
            });
          }

          const existingUser = await db.collection("users").findOne({ email });
          if (existingUser) {
            return reply.status(400).send({ 
              message: `A user with email ${email} already exists. Please use a different email.`
            });
          }
        }

        const registrationData: any = {
          courseIds,
          status: "pending",
          createdAt: new Date(),
          basicDetails: data,
          payment: { status: "pending", amount: 0 }
        };

        const result = await db.collection("registrations").insertOne(registrationData);
        return reply.send({ id: result.insertedId.toString(), message: "Registration started" });
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
        else if (step === 6) updateData.payment = data;

        if (Object.keys(updateData).length > 0) {
          await db.collection("registrations").updateOne(
            { _id: new ObjectId(studentId) },
            { $set: updateData }
          );
        }

        return reply.send({ message: "Step data saved", id: studentId });
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

  fastify.put<{ Params: { id: string }; Body: { payment?: { amount: number; status: string; reference?: string; notes?: string } } }>(
    "/:id/payment",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { payment } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

      if (!payment) {
        return reply.status(400).send({ message: "Payment data is required" });
      }

      const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
      if (!registration) {
        return reply.status(404).send({ message: "Registration not found" });
      }

      await db.collection("registrations").updateOne(
        { _id: new ObjectId(id) },
        { $set: { payment: { ...payment, updatedAt: new Date() } } }
      );

      return reply.send({ message: "Payment updated successfully", payment });
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

        if (registration.status === "approved") {
          return reply.status(400).send({ message: "Student is already approved" });
        }

        if (registration.status === "rejected") {
          return reply.status(400).send({ message: "Cannot approve a rejected registration. Create a new one." });
        }

        if (!registration.payment || registration.payment.status !== "completed") {
          return reply.status(400).send({ message: "Cannot approve: Payment not completed. Please update payment status first." });
        }

        const firstName = registration.basicDetails?.firstName || "Student";
        const lastName = registration.basicDetails?.lastName || "";
        const userEmail = registration.basicDetails?.email?.trim();

        let userId: string;
        let credentials: { email: string; password: string };

        if (registration.userId) {
          const existingUser = await db.collection("users").findOne({ _id: new ObjectId(registration.userId) });
          if (existingUser) {
            const newPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.collection("users").updateOne(
              { _id: new ObjectId(registration.userId) },
              { $set: { approved: true, password: hashedPassword } }
            );
            userId = registration.userId;
            credentials = { email: existingUser.email, password: newPassword };
          } else {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const userResult = await db.collection("users").insertOne({
              name: `${firstName} ${lastName}`.trim(),
              email: userEmail,
              password: hashedPassword,
              role: "student",
              approved: true,
              createdAt: new Date()
            });
            userId = userResult.insertedId.toString();
            credentials = { email: userEmail, password: randomPassword };
          }
        } else {
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const userResult = await db.collection("users").insertOne({
            name: `${firstName} ${lastName}`.trim(),
            email: userEmail,
            password: hashedPassword,
            role: "student",
            approved: true,
            createdAt: new Date()
          });
          userId = userResult.insertedId.toString();
          credentials = { email: userEmail, password: randomPassword };
        }

        await db.collection("registrations").updateOne(
          { _id: new ObjectId(id) },
          { $set: { 
            status: "approved", 
            userId,
            credentials,
            approvedAt: new Date()
          }}
        );

        await db.collection("documents").updateMany(
          { registrationId: id },
          { $set: { studentId: userId } }
        );

        return reply.send({ 
          message: "Student approved successfully", 
          credentials,
          userId,
          status: "approved"
        });
      } else if (action === "reject") {
        const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
        
        if (!registration) {
          return reply.status(404).send({ message: "Registration not found" });
        }

        if (registration.status === "approved") {
          return reply.status(400).send({ message: "Cannot reject an already approved student." });
        }

        if (registration.status === "rejected") {
          return reply.status(400).send({ message: "Student is already rejected" });
        }

        await db.collection("registrations").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "rejected", rejectedAt: new Date() } }
        );
        
        return reply.send({ message: "Student rejected", status: "rejected" });
      }

      return reply.status(400).send({ message: "Invalid action" });
    }
  );
}
