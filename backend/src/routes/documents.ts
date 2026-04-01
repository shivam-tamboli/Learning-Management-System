import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";

const pump = promisify(pipeline);

interface UploadBody {
  studentId?: string;
  registrationId?: string;
  type?: string;
}

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { studentId?: string; registrationId?: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any] },
    async (request: any, reply) => {
      const { studentId, registrationId } = request.query;
      const db = getDB();
      const currentUser = request.user;
      
      const query: any = {};
      
      if (currentUser.role === "admin") {
        if (studentId) query.studentId = studentId;
        if (registrationId) query.registrationId = registrationId;
      } else {
        query.studentId = currentUser.id;
      }
      
      const documents = await db.collection("documents").find(query).toArray();
      return documents;
    }
  );

  fastify.post(
    "/",
    { 
      preHandler: [fastify.authenticate as any, fastify.requireAdmin as any],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const db = getDB();
      const startTime = Date.now();
      console.log(`[DOCUMENT UPLOAD] Starting upload request`);
      
      let file: any = null;
      let studentId = "";
      let registrationId = "";
      let type = "";
      let tempFilePath = "";
      
      const uploadDir = path.join(process.cwd(), "uploads", "documents");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      try {
        const parts = request.parts();
        
        const handler = async (part: any) => {
          if (part.type === 'file') {
            file = part;
            const fileName = `${Date.now()}-${file.filename}`;
            tempFilePath = path.join(uploadDir, fileName);
            console.log(`[DOCUMENT UPLOAD] Saving file to temp: ${tempFilePath}`);
            await pump(part.file, fs.createWriteStream(tempFilePath));
            console.log(`[DOCUMENT UPLOAD] File written to temp`);
          } else {
            if (part.fieldname === "studentId") studentId = String(part.value);
            if (part.fieldname === "registrationId") registrationId = String(part.value);
            if (part.fieldname === "type") type = String(part.value);
          }
        };
        
        for await (const part of parts) {
          await handler(part);
        }
        
        console.log(`[DOCUMENT UPLOAD] Parsed all parts, file: ${!!file}, type: ${type}`);
      } catch (err: any) {
        console.error("[DOCUMENT UPLOAD] Error processing upload:", err.message);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        if (err.code === 'LIMIT_PART_COUNT') {
          return reply.status(400).send({ message: "Too many fields in request" });
        }
        return reply.status(400).send({ message: "Error processing upload" });
      }

      if (!file || !type) {
        console.log("[DOCUMENT UPLOAD] Missing file or type");
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        return reply.status(400).send({ message: "Missing file or type" });
      }

      if (!studentId && !registrationId) {
        console.log("[DOCUMENT UPLOAD] Missing studentId and registrationId");
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        return reply.status(400).send({ message: "Missing studentId or registrationId" });
      }

      const finalFileName = `${Date.now()}-${file.filename}`;
      const finalFilePath = path.join(uploadDir, finalFileName);
      
      try {
        fs.renameSync(tempFilePath, finalFilePath);
        console.log(`[DOCUMENT UPLOAD] File moved to final location: ${finalFilePath}`);
      } catch (err) {
        console.error("[DOCUMENT UPLOAD] Error moving file:", err);
        return reply.status(500).send({ message: "Error saving file" });
      }

      const stat = fs.statSync(finalFilePath);
      const docData: any = {
        type,
        fileName: file.filename,
        filePath: `/uploads/documents/${finalFileName}`,
        mimeType: file.mimetype,
        size: stat.size,
        uploadedAt: new Date()
      };
      
      if (studentId) docData.studentId = studentId;
      if (registrationId) docData.registrationId = registrationId;

      try {
        const result = await db.collection("documents").insertOne(docData);
        console.log(`[DOCUMENT UPLOAD] Document saved to DB: ${result.insertedId}`);
        
        const duration = Date.now() - startTime;
        console.log(`[DOCUMENT UPLOAD] Upload completed in ${duration}ms`);
        
        return reply.send({ 
          id: result.insertedId.toString(), 
          studentId, 
          registrationId,
          type, 
          filePath: `/uploads/documents/${finalFileName}`,
          fileName: file.filename
        });
      } catch (dbErr) {
        console.error("[DOCUMENT UPLOAD] Database error:", dbErr);
        if (fs.existsSync(finalFilePath)) {
          fs.unlinkSync(finalFilePath);
        }
        return reply.status(500).send({ message: "Failed to save document metadata" });
      }
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