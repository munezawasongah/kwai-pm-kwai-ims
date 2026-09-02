import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Clients</h1>
        <NewClientDialog />
      </div>

      <form className="mb-4">
        <Input name="q" defaultValue={q} placeholder="Search by name, email, or phone..." className="max-w-sm" />
      </form>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Nationality</th>
              <th className="px-6 py-3">Bookings</th>
              <th className="px-6 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/clients/${c.id}`} className="font-medium text-brand hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-6 py-3">{c.phone}</td>
                <td className="px-6 py-3">{c.email ?? "—"}</td>
                <td className="px-6 py-3">{c.nationality ?? "—"}</td>
                <td className="px-6 py-3">{c._count.bookings}</td>
                <td className="px-6 py-3">{c.source.replace(/_/g, " ")}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
