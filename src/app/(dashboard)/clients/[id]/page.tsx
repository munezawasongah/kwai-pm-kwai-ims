import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      bookings: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-brand">
          {client.firstName} {client.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          {client.phone} {client.email ? `· ${client.email}` : ""} {client.nationality ? `· ${client.nationality}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Bookings</h2>
        </CardHeader>
        <CardContent>
          {client.bookings.length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
          <div className="space-y-2">
            {client.bookings.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.bookingRef}</p>
                </div>
                <Badge status={b.status} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Recent Messages</h2>
        </CardHeader>
        <CardContent>
          {client.messages.length === 0 && <p className="text-sm text-gray-400">No messages yet.</p>}
          <div className="space-y-2">
            {client.messages.map((m) => (
              <div key={m.id} className="rounded border p-3 text-sm">
                <p className="mb-1 text-xs text-gray-400">
                  {m.channel} · {m.direction} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
          <Link href={`/inbox?clientId=${client.id}`} className="mt-3 inline-block text-sm text-brand hover:underline">
            Open in Inbox →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
