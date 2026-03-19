import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { connectDB } from "./db/index.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { courseRoutes } from "./routes/courses.js";
import { moduleRoutes } from "./routes/modules.js";
import { videoRoutes } from "./routes/videos.js";
import { registrationRoutes } from "./routes/registration.js";
import { documentRoutes } from "./routes/documents.js";
import { paymentRoutes } from "./routes/payments.js";
import { progressRoutes } from "./routes/progress.js";

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "lms-secret-key-change-in-production",
  });

  fastify.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Unauthorized" });
    }
  });

  fastify.decorate("requireAdmin", async function (request: any, reply: any) {
    if (request.user.role !== "admin") {
      reply.status(403).send({ message: "Admin access required" });
    }
  });

  await connectDB();

  fastify.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(userRoutes, { prefix: "/api/users" });
  await fastify.register(courseRoutes, { prefix: "/api/courses" });
  await fastify.register(moduleRoutes, { prefix: "/api/modules" });
  await fastify.register(videoRoutes, { prefix: "/api/videos" });
  await fastify.register(registrationRoutes, { prefix: "/api/registration" });
  await fastify.register(documentRoutes, { prefix: "/api/documents" });
  await fastify.register(paymentRoutes, { prefix: "/api/payment" });
  await fastify.register(progressRoutes, { prefix: "/api/progress" });

  return fastify;
}

const start = async () => {
  try {
    const fastify = await buildServer();
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();