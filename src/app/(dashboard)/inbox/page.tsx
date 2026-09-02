import { prisma } from "@/lib/prisma";
import { InboxClient } from "@/components/inbox/inbox-client";

export default async function InboxPage({ searchParams }: { searchParams: { clientId?: string } }) {
  const clients = await prisma.client.findMany({
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    orderBy: { createdAt: "desc" },
  });

  return <InboxClient clients={clients} initialClientId={searchParams.clientId} />;
}
