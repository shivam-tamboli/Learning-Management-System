import { FastifyInstance } from "fastify";
import { getDB } from "../db/index.js";
import bcrypt from "bcryptjs";

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

      const token = fastify.jwt.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        approved: user.approved
      });

      return {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved
        }
      };
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
        approved: role === "admin"
      });

      return { id: result.insertedId.toString(), name, email, role };
    }
  );
}