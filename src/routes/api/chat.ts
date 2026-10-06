import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createResponsesCall } from "@/lib/ai/responses.server";
import { retrieve } from "@/lib/retrieve";

const SYSTEM = `You are NexaHR, an internal HR helpdesk assistant.
Answer ONLY from the approved HR context supplied below. Never invent policies, numbers, dates, contacts, links or approvals.
If the context does not answer the question, say the approved knowledge base does not cover it and direct the employee to the HR Helpdesk.
For sensitive topics (harassment, retaliation, termination, medical, legal, whistleblowing) be especially conservative.
Cite the policy section (e.g. "Annual Leave Policy §3.1"). Mention the relevant form and contact team when available.
Preserve placeholders like TO_BE_DEFINED_BY_MANAGEMENT exactly. Be clear and concise; use bullets for procedures.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, {
          auth: { persistSession: false },
        });
        const { data: user } = await sb.auth.getUser(token);
        if (!user.user) return new Response("Unauthorized", { status: 401 });

        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const recent = messages.slice(-8);
        const last = [...recent].reverse().find((m) => m.role === "user");
        const q = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ") ?? "";
        const { sources } = retrieve(q);
        const context = sources.length
          ? sources.map((s) => `[${s.cite} — ${s.title}] ${s.text} (Form: ${s.form || "n/a"}; Contact: ${s.contact})`).join("\n")
          : "No relevant approved context found.";

        return createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev", apiKey: process.env['LOVABLE_API_KEY']!, model: "openai/gpt-6-astra" },
          await convertToModelMessages(recent),
          `${SYSTEM}\n\nAPPROVED CONTEXT:\n${context}`,
        ).response();
      },
    },
  },
});
