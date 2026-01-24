"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, isValidCredentials } from "../../lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();

  if (!isValidCredentials(password)) {
    redirect("/login?error=1");
  }

  cookies().set(AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  redirect("/");
}

export async function logout() {
  cookies().set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });

  redirect("/login");
}
