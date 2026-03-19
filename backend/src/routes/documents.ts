import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";

const pump = promisify(pipeline);

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { studentId: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any] },
    async (request, reply) => {
      const { studentId } = request.query;
      const db = getDB();
      
      const documents = await db.collection("documents").find({ studentId }).toArray();
      return documents;
    }
  );

  fastify.post(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request: any, reply: any) => {
      const db = getDB();
      
      let file: any;
      let studentId = "";
      let type = "";

      try {
        const parts = request.parts();
        for await (const part of parts as any) {
          if (part.type === 'file') {
            file = part;
          } else {
            if (part.fieldname === "studentId") studentId = String(part.value);
            if (part.fieldname === "type") type = String(part.value);
          }
        }
      } catch (err) {
        return reply.status(400).send({ message: "Error processing upload" });
      }

      if (!file || !studentId || !type) {
        return reply.status(400).send({ message: "Missing file, studentId, or type" });
      }

      const uploadDir = path.join(process.cwd(), "uploads", "documents");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.filename}`;
      const filePath = path.join(uploadDir, fileName);

      try {
        await pump(file.file, fs.createWriteStream(filePath));
      } catch (err) {
        return reply.status(500).send({ message: "Error saving file" });
      }

      const result = await db.collection("documents").insertOne({
        studentId,
        type,
        fileName: file.filename,
        filePath: `/uploads/documents/${fileName}`,
        mimeType: file.mimetype,
        size: file.file.bytesRead || 0,
        uploadedAt: new Date()
      });

      return { 
        id: result.insertedId.toString(), 
        studentId, 
        type, 
        filePath: `/uploads/documents/${fileName}`,
        fileName: file.filename
      };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid document ID" });
      }

      const doc = await db.collection("documents").findOne({ _id: new ObjectId(id) });
      if (doc?.filePath) {
        const fullPath = path.join(process.cwd(), doc.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      await db.collection("documents").deleteOne({ _id: new ObjectId(id) });
      return { message: "Document deleted" };
    }
  );
}