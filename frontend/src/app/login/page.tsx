"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authService } from "@/lib/api";
import { useAPI } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const loginAPI = useAPI(() => authService.login(email, password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginAPI.execute();
      if (response?.data?.token) {
        success("Login successful!");
        await authLogin(email, password);
        const user = response.data.user;
        if (user?.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    } catch (err: any) {
      showError(loginAPI.error || "Login failed");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>LMS Platform</h1>
        <p className={styles.subtitle}>Sign in to continue</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loginAPI.loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loginAPI.loading}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loginAPI.loading}>
            {loginAPI.loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}