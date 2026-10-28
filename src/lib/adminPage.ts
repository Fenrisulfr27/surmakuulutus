import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdministrator } from "./adminAuth";

export const pageAdministrator = cache(async () => getAdministrator(await headers()));

export async function requirePageAdministrator() {
  const administrator = await pageAdministrator();
  if (!administrator) redirect("/admin");
  return administrator;
}
