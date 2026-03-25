import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/queries/sessions";
import { getMessagesForSession } from "@/lib/supabase/queries/messages";
import { getProfile } from "@/lib/supabase/queries/profiles";
import { getStudentsForParent } from "@/lib/supabase/queries/students";
import { ChatWindow } from "@/components/chat/chat-window";
import type { Subject } from "@/types/app";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect("/login");
  const students = await getStudentsForParent(supabase, profile.id);
  const firstStudent = students[0];
  if (!firstStudent) redirect("/chat");

  const session = await getSession(supabase, sessionId).catch(() => null);
  if (!session) notFound();

  const messages = await getMessagesForSession(supabase, sessionId);

  const sessionWithSubject = session as typeof session & { subjects: Subject | null };

  return (
    <ChatWindow
      session={sessionWithSubject}
      initialMessages={messages}
      studentId={firstStudent.id}
    />
  );
}
