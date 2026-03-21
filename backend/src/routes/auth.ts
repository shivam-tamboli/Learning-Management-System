import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from "../utils/token.js";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { email: string; password: string } }>(
    "/login",
    async (request, reply) => {
      const { email, password } = request.body;
      const db = getDB();

      const user = await db.collection("users").findOne({ email });
      if (!user) {
        return reply.status(401).send({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send({ message: "Invalid credentials" });
      }

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        approved: user.approved,
      });
      const refreshToken = generateRefreshToken(user._id.toString());
      const refreshTokenHash = hashToken(refreshToken);

      await db.collection("sessions").insertOne({
        userId: user._id,
        refreshTokenHash,
        userAgent: request.headers["user-agent"],
        ip: request.ip,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      });

      return reply.send({
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved,
        },
      });
    }
  );

  fastify.post<{ Body: { refreshToken: string } }>(
    "/refresh",
    async (request, reply) => {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return reply.status(400).send({ message: "Refresh token required" });
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return reply.status(401).send({ message: "Invalid or expired refresh token" });
      }

      const db = getDB();
      const tokenHash = hashToken(refreshToken);

      const session = await db.collection("sessions").findOne({
        refreshTokenHash: tokenHash,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return reply.status(401).send({ message: "Invalid or expired refresh token" });
      }

      const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.id) });
      if (!user) {
        return reply.status(401).send({ message: "User not found" });
      }

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        approved: user.approved,
      });

      return reply.send({ accessToken });
    }
  );

  fastify.post<{ Body: { refreshToken?: string } }>(
    "/logout",
    async (request, reply) => {
      const { refreshToken } = request.body;

      if (refreshToken) {
        const db = getDB();
        const tokenHash = hashToken(refreshToken);

        await db.collection("sessions").deleteOne({
          refreshTokenHash: tokenHash,
        });
      }

      return reply.send({ message: "Logged out successfully" });
    }
  );

  fastify.post<{ Body: { name: string; email: string; password: string; role: string } }>(
    "/register",
    { preHandler: [fastify.authenticate as any, fastify.requireAdmin as any] },
    async (request, reply) => {
      const { name, email, password, role } = request.body;
      const db = getDB();

      const existing = await db.collection("users").findOne({ email });
      if (existing) {
        return reply.status(400).send({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await db.collection("users").insertOne({
        name,
        email,
        password: hashedPassword,
        role: role || "student",
        approved: role === "admin",
      });

      return { id: result.insertedId.toString(), name, email, role };
    }
  );
}
