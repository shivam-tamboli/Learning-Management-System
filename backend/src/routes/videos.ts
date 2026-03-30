import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import { ObjectId } from "mongodb";

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export async function videoRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { moduleId: string } }>(
    "/",
    { preHandler: [fastify.authenticate as any] },
    async (request, reply) => {
      const { moduleId } = request.query;
      const db = getDB();
      
      const videos = await db.collection("videos").find({ moduleId }).toArray();
      return videos;
    }
  );

  fastify.post<{ Body: { moduleId: string; title: string; youtubeUrl?: string; duration?: number; description?: string; videoType?: "youtube" | "demo-local"; localVideoPath?: string; audioTracks?: { id: string; language: string; languageCode: string; filePath: string }[] } }>(
    "/",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { moduleId, title, youtubeUrl, duration, description, videoType, localVideoPath, audioTracks } = request.body;
      const db = getDB();

      const videoData: any = { 
        moduleId, 
        title, 
        duration: duration || 0,
        description: description || "",
        createdAt: new Date()
      };

      if (videoType === "demo-local") {
        videoData.videoType = "demo-local";
        videoData.localVideoPath = localVideoPath || "";
        videoData.audioTracks = audioTracks || [];
        videoData.youtubeUrl = "";
      } else {
        videoData.videoType = "youtube";
        videoData.youtubeUrl = youtubeUrl || "";
      }

      const result = await db.collection("videos").insertOne(videoData);
      return { 
        id: result.insertedId.toString(), 
        moduleId, 
        title, 
        youtubeUrl: videoData.youtubeUrl,
        duration,
        videoType: videoData.videoType,
        localVideoPath: videoData.localVideoPath,
        audioTracks: videoData.audioTracks
      };
    }
  );

  fastify.put<{ Params: { id: string }; Body: { title?: string; youtubeUrl?: string; videoType?: "youtube" | "demo-local"; localVideoPath?: string; audioTracks?: { id: string; language: string; languageCode: string; filePath: string }[] } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const { title, youtubeUrl, videoType, localVideoPath, audioTracks } = request.body;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid video ID" });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
      if (videoType !== undefined) updateData.videoType = videoType;
      if (localVideoPath !== undefined) updateData.localVideoPath = localVideoPath;
      if (audioTracks !== undefined) updateData.audioTracks = audioTracks;

      await db.collection("videos").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return { message: "Video updated successfully" };
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { id } = request.params;
      const db = getDB();

      if (!isValidObjectId(id)) {
        return reply.status(400).send({ message: "Invalid video ID" });
      }

      await db.collection("progress").deleteMany({ videoId: id });
      await db.collection("videos").deleteOne({ _id: new ObjectId(id) });
      return { message: "Video and related progress deleted" };
    }
  );
}