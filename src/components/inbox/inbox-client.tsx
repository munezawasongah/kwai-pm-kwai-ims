"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ClientLite {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

interface Message {
  id: string;
  channel: string;
  direction: string;
  body: string;
  subject: string | null;
  createdAt: string;
  status: string;
}

export function InboxClient({ clients, initialClientId }: { clients: ClientLite[]; initialClientId?: string }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialClientId ?? clients[0]?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState("WHATSAPP");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async (clientId: string) => {
    const res = await fetch(`/api/messages?clientId=${clientId}`);
    const data = await res.json();
    setMessages(data);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const interval = setInterval(() => loadMessages(selectedId), 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  async function handleSend() {
    if (!selectedId || !body) return;
    setSending(true);

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: selectedId, channel, subject, body: body }),
    });

    setBody("");
    setSubject("");
    setSending(false);
    loadMessages(selectedId);
  }

  const selectedClient = clients.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-72 shrink-0 overflow-y-auto border-r bg-white">
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`block w-full border-b px-4 py-3 text-left text-sm hover:bg-gray-50 ${
              selectedId === c.id ? "bg-brand/5" : ""
            }`}
          >
            <p className="font-medium">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-gray-400">{c.phone}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        {selectedClient ? (
          <>
            <div className="border-b bg-white px-6 py-3">
              <p className="font-semibold">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              <p className="text-xs text-gray-400">
                {selectedClient.phone} {selectedClient.email ? `· ${selectedClient.email}` : ""}
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-md ${m.direction === "OUTBOUND" ? "ml-auto text-right" : ""}`}>
                  <div
                    className={`inline-block rounded-lg px-4 py-2 text-sm ${
                      m.direction === "OUTBOUND" ? "bg-brand text-white" : "bg-white border"
                    }`}
                  >
                    {m.subject && <p className="mb-1 font-semibold">{m.subject}</p>}
                    <p>{m.body}</p>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {m.channel} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-gray-400">No messages yet.</p>}
            </div>

            <div className="border-t bg-white p-4">
              <div className="mb-2 flex gap-2">
                <Select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-32">
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </Select>
                {channel === "EMAIL" && (
                  <Input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={2}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={sending || !body}>
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">Select a client to start messaging</div>
        )}
      </div>
    </div>
  );
}
