"use client";

import { useState } from "react";
import { PlusCircle, Trash2, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ToolNote {
  id: string;
  note_text: string;
  url: string | null;
  url_label: string | null;
  author_role: "admin" | "mentor";
  created_by: string;
  created_at: string;
}

interface ToolNotesPanelProps {
  teamId: string;
  artifactType: string;
  platformRole: "admin" | "mentor" | "entrepreneur";
  currentUserId: string;
  adminNotes: ToolNote[];
  mentorNotes: ToolNote[];
}

export function ToolNotesPanel({
  teamId,
  artifactType,
  platformRole,
  currentUserId,
  adminNotes: initialAdminNotes,
  mentorNotes: initialMentorNotes,
}: ToolNotesPanelProps) {
  const [adminNotes, setAdminNotes] = useState<ToolNote[]>(initialAdminNotes);
  const [mentorNotes, setMentorNotes] = useState<ToolNote[]>(initialMentorNotes);
  const [expanded, setExpanded] = useState(
    initialAdminNotes.length > 0 || initialMentorNotes.length > 0
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteUrl, setNewNoteUrl] = useState("");
  const [newNoteUrlLabel, setNewNoteUrlLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canAddNotes = platformRole === "admin" || platformRole === "mentor";
  const hasNotes = adminNotes.length > 0 || mentorNotes.length > 0;
  const supabase = createClient();

  async function handleAddNote() {
    if (!newNoteText.trim()) return;
    setSaving(true);

    const payload = {
      artifact_type: artifactType,
      team_id: platformRole === "mentor" ? teamId : null,
      created_by: currentUserId,
      author_role: platformRole as "admin" | "mentor",
      note_text: newNoteText.trim(),
      url: newNoteUrl.trim() || null,
      url_label: newNoteUrlLabel.trim() || null,
    };

    const { data, error } = await supabase
      .from("tool_notes")
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) {
      const newNote = data as ToolNote;
      if (platformRole === "admin") {
        setAdminNotes((prev) => [...prev, newNote]);
      } else {
        setMentorNotes((prev) => [...prev, newNote]);
      }
      setNewNoteText("");
      setNewNoteUrl("");
      setNewNoteUrlLabel("");
      setShowAddForm(false);
    }
    setSaving(false);
  }

  async function handleDeleteNote(noteId: string, role: "admin" | "mentor") {
    setDeletingId(noteId);
    const { error } = await supabase
      .from("tool_notes")
      .delete()
      .eq("id", noteId);

    if (!error) {
      if (role === "admin") {
        setAdminNotes((prev) => prev.filter((n) => n.id !== noteId));
      } else {
        setMentorNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    }
    setDeletingId(null);
  }

  return (
    <div className="rounded-lg border bg-muted/20">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          Guidance
          {hasNotes && (
            <Badge variant="secondary" className="text-xs">
              {adminNotes.length + mentorNotes.length}
            </Badge>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Admin notes */}
          {adminNotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Platform Guidance
              </p>
              {adminNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  canDelete={platformRole === "admin" && note.created_by === currentUserId}
                  onDelete={() => handleDeleteNote(note.id, "admin")}
                  deleting={deletingId === note.id}
                />
              ))}
            </div>
          )}

          {/* Mentor notes */}
          {mentorNotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                From Your Mentor
              </p>
              {mentorNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  canDelete={platformRole === "mentor" && note.created_by === currentUserId}
                  onDelete={() => handleDeleteNote(note.id, "mentor")}
                  deleting={deletingId === note.id}
                />
              ))}
            </div>
          )}

          {!hasNotes && !canAddNotes && (
            <p className="text-sm text-muted-foreground">No guidance added yet.</p>
          )}

          {/* Add note form */}
          {canAddNotes && (
            <>
              {hasNotes && <Separator />}
              {showAddForm ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="note-text" className="text-xs">Note</Label>
                    <Textarea
                      id="note-text"
                      placeholder="Add guidance for teams using this tool..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="note-url" className="text-xs">URL (optional)</Label>
                      <Input
                        id="note-url"
                        placeholder="https://..."
                        value={newNoteUrl}
                        onChange={(e) => setNewNoteUrl(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="note-url-label" className="text-xs">Link label (optional)</Label>
                      <Input
                        id="note-url-label"
                        placeholder="e.g. SA case study"
                        value={newNoteUrlLabel}
                        onChange={(e) => setNewNoteUrlLabel(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNote} disabled={!newNoteText.trim() || saving}>
                      {saving ? <Loader2 className="size-3 animate-spin" /> : null}
                      Save note
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(true)}
                  className="text-muted-foreground"
                >
                  <PlusCircle className="size-4" />
                  Add guidance note
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  canDelete,
  onDelete,
  deleting,
}: {
  note: ToolNote;
  canDelete: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{note.note_text}</p>
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        )}
      </div>
      {note.url && (
        <a
          href={note.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          {note.url_label || note.url}
        </a>
      )}
    </div>
  );
}
