import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { studentId: string } }>(
    "/",
    async (request, reply) => {
      const { studentId } = request.query;
      const db = getDB();
      
      const documents = await db.collection("documents").find({ studentId }).toArray();
      return documents;
    }
  );

  fastify.post<{ Body: { studentId: string; type: string; filePath: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { studentId, type, filePath } = request.body;
      const db = getDB();

      const result = await db.collection("documents").insertOne({
        studentId,
        type,
        filePath,
        uploadedAt: new Date()
      });

      return { id: result.insertedId.toString(), studentId, type, filePath };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      const doc = await db.collection("documents").findOne({ _id: new ObjectId(id) });
      if (doc?.filePath && fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }

      await db.collection("documents").deleteOne({ _id: new ObjectId(id) });
      return { message: "Document deleted" };
    }
  );
}