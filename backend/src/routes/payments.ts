import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { studentId?: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { studentId } = request.query;
      const db = getDB();
      
      const query = studentId ? { studentId } : {};
      const payments = await db.collection("payments").find(query).toArray();
      return payments;
    }
  );

  fastify.post<{ Body: { studentId: string; amount: number; status?: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request: any, reply) => {
      const { studentId, amount, status = "pending" } = request.body;
      const db = getDB();

      if (!ObjectId.isValid(studentId)) {
        return reply.status(400).send({ message: "Invalid student ID" });
      }

      const result = await db.collection("payments").insertOne({
        studentId,
        amount,
        status,
        createdAt: new Date(),
        recordedBy: request.user?.id
      });

      return reply.send({
        id: result.insertedId.toString(),
        studentId,
        amount,
        status,
        message: "Payment recorded successfully"
      });
    }
  );

  fastify.put<{ Params: { id: string }; Body: { status: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { status } = request.body;
      const db = getDB();

      if (!ObjectId.isValid(id)) {
        return reply.status(400).send({ message: "Invalid payment ID" });
      }

      if (!["pending", "completed"].includes(status)) {
        return reply.status(400).send({ message: "Invalid status. Must be 'pending' or 'completed'" });
      }

      await db.collection("payments").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
      );

      return { message: "Payment status updated", status };
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    "/student/:studentId",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { studentId } = request.params;
      const db = getDB();

      if (!ObjectId.isValid(studentId)) {
        return reply.status(400).send({ message: "Invalid student ID" });
      }

      const payments = await db.collection("payments").find({ studentId }).toArray();
      return payments;
    }
  );
}
