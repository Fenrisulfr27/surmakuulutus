"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Group, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function AdminViewed({ id, unviewed }: { id: string; unviewed: boolean }) {
  const [error, setError] = useState(false);
  const router = useRouter();
  const markViewed = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/kuulutused/${id}/view`, { method: "POST" });
      if (!response.ok) throw new Error();
      setError(false);
      router.refresh();
    } catch { setError(true); }
  }, [id, router]);

  useEffect(() => {
    if (unviewed) void markViewed();
  }, [unviewed, markViewed]);

  if (!unviewed) return null;
  return <Group mb="md"><span className="admin-new-label">UUS!</span>
    {error && <><Text role="alert">Vaatamise salvestamine ebaõnnestus.</Text>
      <Button variant="subtle" onClick={markViewed}>Proovi uuesti</Button></>}
  </Group>;
}
