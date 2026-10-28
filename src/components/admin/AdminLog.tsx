"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { adminDate } from "./AdminTable";

export default function AdminLog({ rows }: { rows: Array<{
  _id: string; timestamp: string; action: string; obituaryId?: string; ipBanId?: string; administrator: string; result: string;
}> }) {
  return <Table.ScrollContainer minWidth={650}><Table striped>
    <Table.Thead><Table.Tr>{["Aeg", "Toiming", "Kuulutus", "Administraator", "Tulemus"].map((label) => <Table.Th key={label}>{label}</Table.Th>)}</Table.Tr></Table.Thead>
    <Table.Tbody>{rows.map((entry) => <Table.Tr key={entry._id}>
      <Table.Td>{adminDate(entry.timestamp)}</Table.Td><Table.Td>{entry.action}</Table.Td>
      <Table.Td>{entry.obituaryId ? <Link href={`/admin/kuulutused/${entry.obituaryId}`}>{entry.obituaryId}</Link>
        : entry.ipBanId ? <Link href="/admin/ip-keelud">IP-keeld ({entry.ipBanId})</Link> : "—"}</Table.Td>
      <Table.Td>{entry.administrator}</Table.Td><Table.Td>{entry.result}</Table.Td>
    </Table.Tr>)}</Table.Tbody>
  </Table></Table.ScrollContainer>;
}
