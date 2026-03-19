import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { studentId: string } }>(
    "/",
    async (request, reply) => {
      const { studentId } = request.query;
      const db = getDB();
      
      const payments = await db.collection("payments").find({ studentId }).toArray();
      return payments;
    }
  );

  fastify.post<{ Body: { studentId: string; amount: number } }>(
    "/init",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { studentId, amount } = request.body;
      const db = getDB();

      const result = await db.collection("payments").insertOne({
        studentId,
        amount,
        status: "pending",
        createdAt: new Date()
      });

      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || ""
      });

      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `rcpt_${result.insertedId}`
      });

      await db.collection("payments").updateOne(
        { _id: result.insertedId },
        { $set: { razorpayOrderId: order.id } }
      );

      return { orderId: order.id, amount, paymentId: result.insertedId.toString() };
    }
  );

  fastify.post<{ Body: { paymentId: string; razorpayPaymentId: string; razorpaySignature: string } }>(
    "/verify",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { paymentId, razorpayPaymentId, razorpaySignature } = request.body;
      const db = getDB();

      await db.collection("payments").updateOne(
        { _id: new ObjectId(paymentId) },
        { $set: { razorpayPaymentId, razorpaySignature, status: "completed", verifiedAt: new Date() } }
      );

      return { message: "Payment verified successfully" };
    }
  );
}