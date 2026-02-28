import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRenderer } from "@/lib/export/renderers";
import type { ValueProposition } from "@/lib/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Fetch artifact
  const { data: artifact, error } = await supabase
    .from("artifacts")
    .select("id, team_id, artifact_type, title, data")
    .eq("id", artifactId)
    .single();

  if (error || !artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Verify user has access to this team
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", artifact.team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (!member && profile?.platform_role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch team name and value proposition
  const { data: team } = await supabase
    .from("teams")
    .select("name, operating_name, value_proposition")
    .eq("id", artifact.team_id)
    .single();

  const teamName = team?.operating_name ?? team?.name ?? "SpinUp";
  const vp = (team?.value_proposition as ValueProposition | null) ?? null;

  // Render the document
  const renderer = getRenderer(artifact.artifact_type);
  const buffer = await renderer(artifact.data as Record<string, unknown>, vp, teamName);

  // Save export record
  const storagePath = `exports/${artifact.team_id}/${artifactId}-${Date.now()}.docx`;
  await supabase.storage.from("exports").upload(storagePath, buffer, { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  await supabase.from("artifact_exports").insert({
    artifact_id: artifactId,
    format: "docx",
    storage_path: storagePath,
    created_by: user.id,
  });

  // Return the file directly
  const filename = `${artifact.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
