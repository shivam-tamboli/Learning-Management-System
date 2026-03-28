import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { rateLimitConfig, rateLimitMessages } from "../config/rateLimit.js";
import { notificationService } from "../services/notification.js";

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
    { 
      preHandler: [fastify.authenticate as any, fastify.requireAdmin as any],
      config: {
        rateLimit: {
          max: rateLimitConfig.registration.step.max,
          timeWindow: rateLimitConfig.registration.step.timeWindow,
          errorResponseBuilder: () => ({
            statusCode: 429,
            error: "Too Many Requests",
            message: rateLimitMessages.registration.step,
          }),
        },
      },
    },
    async (request, reply) => {
      const { studentId, courseIds, step, data } = request.body;
      const db = getDB();

      // Step 1: Create draft with courseIds (NEW - was basicDetails)
      if (step === 1 && courseIds && courseIds.length > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Draft expires in 7 days
        
        const registrationData: any = {
          courseIds,
          status: "draft",
          currentStep: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: expiresAt,
          basicDetails: {},
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
        
        // Step 2: Save basicDetails (was step 1)
        if (step === 2) {
          const email = data?.email?.trim?.();
          if (email) {
            const existingRegistration = await db.collection("registrations").findOne({
              _id: { $ne: new ObjectId(studentId) },
              "basicDetails.email": email,
              status: { $in: ["pending", "approved", "draft", "rejected"] }
            });
            
            if (existingRegistration) {
              return reply.status(400).send({ 
                message: `A registration with email ${email} already exists (${existingRegistration.status}). Please use a different email.`
              });
            }

            const existingUser = await db.collection("users").findOne({ email });
            if (existingUser) {
              return reply.status(400).send({ 
                message: `A user with email ${email} already exists. Please use a different email.`
              });
            }
          }
          updateData.basicDetails = data;
        }
        // Step 3: Save address (was step 2)
        else if (step === 3) updateData.address = data;
        // Step 4: Save contact (was step 3)
        else if (step === 4) updateData.contact = data;
        // Step 5: Save education (was step 4)
        else if (step === 5) updateData.education = data;
        // Step 6: Save health (was step 5)
        else if (step === 6) updateData.health = data;
        // Step 7: Save payment (was step 6) - Also transition to pending
        else if (step === 7) {
          updateData.payment = data;
          const existing = await db.collection("registrations").findOne({ _id: new ObjectId(studentId) });
          if (existing && existing.status === "draft") {
            updateData.status = "pending";
          }
        }

        if (Object.keys(updateData).length > 0) {
          updateData.currentStep = step;
          updateData.updatedAt = new Date();
          await db.collection("registrations").updateOne(
            { _id: new ObjectId(studentId) },
            { $set: updateData }
          );
        }

        return reply.send({ message: "Step data saved", id: studentId, status: updateData.status });
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

      const updateData: any = {
        payment: { ...payment, updatedAt: new Date() }
      };

      if (payment.status === "completed" && registration.status === "draft") {
        updateData.status = "pending";
      }

      await db.collection("registrations").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return reply.send({ 
        message: "Payment updated successfully", 
        payment: updateData.payment,
        status: updateData.status || registration.status
      });
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

  fastify.put<{ Params: { id: string }; Body: { basicDetails?: any; address?: any; contact?: any; education?: any; health?: any; payment?: any; courseIds?: string[] } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { basicDetails, address, contact, education, health, payment, courseIds } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

      const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
      if (!registration) {
        return reply.status(404).send({ message: "Registration not found" });
      }

      if (registration.status === "approved") {
        return reply.status(400).send({ message: "Cannot update an approved registration" });
      }

      const updateData: any = {};
      
      if (basicDetails) updateData.basicDetails = basicDetails;
      if (address) updateData.address = address;
      if (contact) updateData.contact = contact;
      if (education) updateData.education = education;
      if (health) updateData.health = health;
      if (payment) {
        updateData.payment = { ...registration.payment, ...payment };
        if (payment.status === "completed" && registration.status === "draft") {
          updateData.status = "pending";
        }
      }
      if (courseIds) updateData.courseIds = courseIds;

      if (registration.status === "draft" && !updateData.status && updateData.payment) {
        updateData.status = "pending";
      }

      updateData.updatedAt = new Date();

      await db.collection("registrations").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return reply.send({ message: "Registration updated successfully" });
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

      const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
      if (!registration) {
        return reply.status(404).send({ message: "Registration not found" });
      }

      if (registration.status === "approved") {
        return reply.status(400).send({ message: "Cannot delete an approved registration to maintain data integrity" });
      }

      // Delete associated user if exists (only for non-approved registrations)
      if (registration.userId) {
        await db.collection("users").deleteOne({ _id: new ObjectId(registration.userId) });
      }

      await db.collection("registrations").deleteOne({ _id: new ObjectId(id) });
      await db.collection("documents").deleteMany({ registrationId: id });

      return reply.send({ message: "Registration deleted successfully" });
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

        if (registration.userId) {
          return reply.status(400).send({ message: "Registration has already been approved. Cannot approve again." });
        }

        if (!registration.payment || registration.payment.status !== "completed") {
          const paymentStatus = registration.payment?.status || "not set";
          return reply.status(400).send({ 
            message: `Cannot approve: Payment status is "${paymentStatus}". Please update payment to "completed" first. Current amount: ₹${registration.payment?.amount || 0}`
          });
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

        // Send notification to student
        notificationService.notifyStudent({
          phone: registration.contact?.phone,
          name: `${firstName} ${lastName}`.trim(),
          status: 'approved',
          email: credentials.email,
          password: credentials.password
        }).catch(err => console.error('Notification error:', err));

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

        // Send notification to student
        notificationService.notifyStudent({
          phone: registration.contact?.phone,
          name: `${registration.basicDetails?.firstName} ${registration.basicDetails?.lastName}`.trim(),
          status: 'rejected'
        }).catch(err => console.error('Notification error:', err));
        
        return reply.send({ message: "Student rejected", status: "rejected" });
      }

      return reply.status(400).send({ message: "Invalid action" });
    }
  );

  fastify.put<{ Params: { id: string }; Body: { userData?: { name?: string; phone?: string; address?: string } } }>(
    "/:id/user",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { userData } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid registration ID" });
      }

      if (!userData) {
        return reply.status(400).send({ message: "User data is required" });
      }

      const registration = await db.collection("registrations").findOne({ _id: new ObjectId(id) });
      if (!registration) {
        return reply.status(404).send({ message: "Registration not found" });
      }

      if (registration.status !== "approved" || !registration.userId) {
        return reply.status(400).send({ message: "Can only update user profile for approved registrations" });
      }

      const updateData: any = {};
      const userUpdateData: any = {};
      
      if (userData.name) {
        const nameParts = userData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        userUpdateData.name = userData.name;
        
        updateData.basicDetails = {
          ...(registration.basicDetails || {}),
          firstName,
          lastName
        };
      }
      
      if (userData.phone) {
        userUpdateData.phone = userData.phone;
        updateData.phone = userData.phone;
        updateData.contact = {
          ...(registration.contact || {}),
          phone: userData.phone
        };
      }
      
      if (userData.address && typeof userData.address === "object") {
        const existingAddress: any = (registration.address as any) || {};
        userUpdateData.address = userData.address;
        updateData.address = Object.assign({}, existingAddress, userData.address);
      }

      if (Object.keys(updateData).length > 0 || Object.keys(userUpdateData).length > 0) {
        const setData: any = { ...updateData, updatedAt: new Date() };
        
        if (Object.keys(userUpdateData).length > 0) {
          await db.collection("users").updateOne(
            { _id: new ObjectId(registration.userId) },
            { $set: userUpdateData }
          );
        }

        if (Object.keys(updateData).length > 0) {
          await db.collection("registrations").updateOne(
            { _id: new ObjectId(id) },
            { $set: setData }
          );
        }
      }

      return reply.send({ message: "User profile updated successfully" });
    }
  );
}
