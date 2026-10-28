"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export function AdminLogin() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const router = useRouter();
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/sign-in/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password"), rememberMe: false }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? "Liiga palju katseid. Proovi 15 minuti pärast." : "Sisselogimine ebaõnnestus.");
        return;
      }
      queryClient.setQueriesData({ queryKey: ["admin-session"] }, { authenticated: true });
      router.replace("/admin");
      router.refresh();
    } catch { setError("Ühenduse viga. Proovi uuesti."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={login} className="newspaper-form admin-login">
    <Stack>
      <TextInput label="E-post" name="email" type="email" autoComplete="username" required maxLength={254} />
      <PasswordInput label="Parool" name="password" autoComplete="current-password" required maxLength={128} />
      {error && <Text role="alert" c="red">{error}</Text>}
      <Button type="submit" loading={busy}>Logi sisse</Button>
    </Stack>
  </form>;
}

export function AdminLogout() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error();
      queryClient.setQueriesData({ queryKey: ["admin-session"] }, { authenticated: false });
      router.replace("/admin");
      router.refresh();
    } catch { setError("Väljalogimine ebaõnnestus."); }
    finally { setBusy(false); }
  }
  return <div><Button size="compact-sm" onClick={logout} loading={busy}>Logi välja</Button>
    {error && <Text role="alert" c="red">{error}</Text>}</div>;
}
