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
        
        // Helper function to check if object has actual data
        const hasActualData = (obj: any): boolean => {
          if (!obj || typeof obj !== 'object') return false;
          if (Array.isArray(obj)) return obj.length > 0;
          return Object.keys(obj).some(key => {
            const value = obj[key];
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            if (typeof value === 'object') return hasActualData(value);
            return true;
          });
        };

        // Step 2: Save basicDetails (was step 1) - merge with existing
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
          // Merge with existing basicDetails, don't overwrite
          if (hasActualData(data)) {
            updateData.basicDetails = { ...(existing.basicDetails || {}), ...data };
          }
        }
        // Step 3: Save address - merge with existing
        else if (step === 3) {
          if (hasActualData(data)) {
            updateData.address = { ...(existing.address || {}), ...data };
          }
        }
        // Step 4: Save contact - merge with existing
        else if (step === 4) {
          if (hasActualData(data)) {
            updateData.contact = { ...(existing.contact || {}), ...data };
          }
        }
        // Step 5: Save education - merge with existing
        else if (step === 5) {
          if (hasActualData(data)) {
            updateData.education = { ...(existing.education || {}), ...data };
          }
        }
        // Step 6: Save health - merge with existing
        else if (step === 6) {
          if (hasActualData(data)) {
            updateData.health = { ...(existing.health || {}), ...data };
          }
        }
        // Step 7: Final step - Transition to pending (documents completed)
        // Documents must be uploaded BEFORE calling step 7 to set status to pending
        else if (step === 7) {
          if (data && Object.keys(data).length > 0) {
            // Handle payment data if provided
            if (data.payment) {
              updateData.payment = { ...(existing.payment || {}), ...data.payment };
            }
            // Handle documentsComplete flag - only set status if documents verified
            if (data.documentsComplete === true) {
              const existingReg = await db.collection("registrations").findOne({ _id: new ObjectId(studentId) });
              // Verify documents exist for this registration
              const docsCount = await db.collection("documents").countDocuments({ registrationId: studentId });
              if (docsCount >= 4) {
                if (existingReg && existingReg.status !== "approved" && existingReg.status !== "pending") {
                  updateData.status = "pending";
                }
              } else {
                return reply.status(400).send({ 
                  success: false,
                  message: "Required documents not uploaded. Please upload all 4 documents before submitting." 
                });
              }
            }
          }
        }

        if (Object.keys(updateData).length > 0) {
          // Reset expiration timer when draft is updated
          if (existing.status === "draft") {
            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + 7);
            updateData.expiresAt = newExpiresAt;
          }
          updateData.currentStep = step;
          updateData.updatedAt = new Date();
          await db.collection("registrations").updateOne(
            { _id: new ObjectId(studentId) },
            { $set: updateData }
          );
        }

        const updatedReg = await db.collection("registrations").findOne({ _id: new ObjectId(studentId) });
        
        // Always return explicit success structure
        return reply.send({ 
          success: true, 
          message: "Step data saved", 
          id: studentId, 
          status: updatedReg?.status 
        });
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
      
      // Helper function to check if object has actual data (not just empty values)
      const hasActualData = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') return false;
        if (Array.isArray(obj)) return obj.length > 0;
        return Object.keys(obj).some(key => {
          const value = obj[key];
          if (value === null || value === undefined) return false;
          if (typeof value === 'string') return value.trim().length > 0;
          if (typeof value === 'object') return hasActualData(value);
          return true;
        });
      };

      // Merge basicDetails - preserve existing values if new values are empty
      if (basicDetails && hasActualData(basicDetails)) {
        updateData.basicDetails = { ...(registration.basicDetails || {}), ...basicDetails };
      } else if (basicDetails && registration.basicDetails) {
        // If basicDetails exists but has no actual data, keep existing
        updateData.basicDetails = registration.basicDetails;
      }

      // Merge address
      if (address && hasActualData(address)) {
        updateData.address = { ...(registration.address || {}), ...address };
      } else if (address && registration.address) {
        updateData.address = registration.address;
      }

      // Merge contact
      if (contact && hasActualData(contact)) {
        updateData.contact = { ...(registration.contact || {}), ...contact };
      } else if (contact && registration.contact) {
        updateData.contact = registration.contact;
      }

      // Merge education
      if (education && hasActualData(education)) {
        updateData.education = { ...(registration.education || {}), ...education };
      } else if (education && registration.education) {
        updateData.education = registration.education;
      }

      // Merge health
      if (health && hasActualData(health)) {
        updateData.health = { ...(registration.health || {}), ...health };
      } else if (health && registration.health) {
        updateData.health = registration.health;
      }

      // Handle payment - always merge
      if (payment) {
        updateData.payment = { ...registration.payment, ...payment };
        if (registration.status === "draft") {
          updateData.status = "pending";
        }
      }

      if (courseIds && courseIds.length > 0) {
        updateData.courseIds = courseIds;
      }

      if (registration.status === "draft" && !updateData.status && updateData.payment) {
        updateData.status = "pending";
      }

      // Reset expiration timer when draft is updated
      if (registration.status === "draft") {
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);
        updateData.expiresAt = newExpiresAt;
      }

      // Reset rejected status to pending when rejected student is edited
      if (registration.status === "rejected") {
        updateData.status = "pending";
        updateData.previouslyRejected = true;
        updateData.rejectedAt = null;
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

        if (registration.userId && !registration.previouslyRejected) {
          return reply.status(400).send({ message: "Registration has already been approved. Cannot approve again." });
        }

        if (registration.status === "rejected" && !registration.previouslyRejected) {
          return reply.status(400).send({ message: "Cannot approve a rejected registration. Please edit and update first." });
        }

        if (!registration.payment || registration.payment.status !== "completed") {
          const paymentStatus = registration.payment?.status || "not set";
          return reply.status(400).send({ 
            message: `Cannot approve: Payment status is "${paymentStatus}". Please update payment to "completed" first. Current amount: ₹${registration.payment?.amount || 0}`
          });
        }

        // Validate required fields before approval
        if (!registration.basicDetails?.firstName?.trim()) {
          return reply.status(400).send({ 
            message: "Cannot approve: First name is missing. Please edit the registration and add the required information."
          });
        }

        if (!registration.basicDetails?.email?.trim()) {
          return reply.status(400).send({ 
            message: "Cannot approve: Email is missing. Please edit the registration and add the required information."
          });
        }

        if (!registration.contact?.phone?.trim()) {
          return reply.status(400).send({ 
            message: "Cannot approve: Phone number is missing. Please edit the registration and add the required information."
          });
        }

        const firstName = registration.basicDetails.firstName.trim();
        const lastName = registration.basicDetails.lastName?.trim() || "";
        const userEmail = registration.basicDetails.email.trim();

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
