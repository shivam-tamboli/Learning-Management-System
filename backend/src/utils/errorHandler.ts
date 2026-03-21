import { FastifyError } from "fastify";
import { AppError } from "./errors.js";
import { fail } from "./response.js";

export function setupErrorHandler(fastify: any) {
  fastify.setErrorHandler((error: FastifyError, request: any, reply: any) => {
    fastify.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(fail(error.message));
    }

    if (error.name === "MongoServerError") {
      if (Number(error.code) === 11000) {
        return reply.status(400).send(fail("Duplicate entry. This record already exists."));
      }
      return reply.status(400).send(fail("Database error: " + error.message));
    }

    const errorCode = error.code;
    if (errorCode === "FST_JWT_NO_AUTHORIZATION_IN_HEADER" || errorCode === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
      return reply.status(401).send(fail("Invalid or missing authorization token"));
    }

    const statusCode = error.statusCode;
    if (statusCode === 401) {
      return reply.status(401).send(fail("Unauthorized"));
    }

    if (statusCode === 404) {
      return reply.status(404).send(fail("Not found"));
    }

    if (error.validation) {
      return reply.status(400).send(fail("Validation error: " + error.message));
    }

    const safeStatusCode = statusCode || 500;
    const message = safeStatusCode >= 500
      ? "Internal server error"
      : error.message || "An error occurred";

    return reply.status(safeStatusCode).send(fail(message));
  });

  fastify.setNotFoundHandler((request: any, reply: any) => {
    reply.status(404).send(fail("Route not found"));
  });
}
