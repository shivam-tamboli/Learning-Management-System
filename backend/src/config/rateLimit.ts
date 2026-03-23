export const rateLimitConfig = {
  auth: {
    login: {
      max: 5,
      timeWindow: "15 minute",
    },
    register: {
      max: 10,
      timeWindow: "15 minute",
    },
  },
  registration: {
    step: {
      max: 30,
      timeWindow: "5 minute",
    },
  },
  global: {
    max: 100,
    timeWindow: "1 minute",
  },
};

export const rateLimitMessages = {
  auth: {
    login: "Too many login attempts. Please try again after 15 minutes.",
    register: "Too many registration attempts. Please try again after 15 minutes.",
  },
  registration: {
    step: "Too many requests. Please slow down and try again later.",
  },
  global: "Too many requests. Please try again later.",
};
