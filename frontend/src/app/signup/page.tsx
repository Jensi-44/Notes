"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // app router
const backend = "http://localhost:3001";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${backend}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      // after signup, redirect to login
      router.push("/login");
    } else {
      // handle error
      alert("Signup failed");
    }
  }

  return (
    <form onSubmit={submit}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Signup</button>
    </form>
  );
}
