import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from "@/lib/api";
import { toast } from "sonner";
import { Users, UserPlus, Crown, Eye, Pencil, Trash2 } from "lucide-react";

const ROLES = [
  { id: "editor", label: "Editor", icon: Pencil, desc: "Can edit content" },
  { id: "viewer", label: "Viewer", icon: Eye, desc: "Read-only access" },
];

export default function ShareDialog({ open, onOpenChange, projectId, currentRole }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);

  const isOwner = currentRole === "owner";

  const refresh = async () => {
    try {
      const m = await listMembers(projectId);
      setMembers(m);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Enter an email");
      return;
    }
    setBusy(true);
    try {
      await inviteMember(projectId, { email: email.trim(), role });
      toast.success(`Invited ${email}`);
      setEmail("");
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      await updateMemberRole(projectId, memberUserId, newRole);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Update failed");
    }
  };

  const handleRemove = async (memberUserId) => {
    try {
      await removeMember(projectId, memberUserId);
      toast.success("Removed");
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Remove failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg tracking-tight inline-flex items-center gap-2">
            <Users className="w-4 h-4" /> Share this project
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Invite collaborators by email. They'll get access the next time they sign in.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="border border-zinc-800 rounded-lg p-3 space-y-2 bg-zinc-950/50">
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="bg-zinc-900 border-zinc-800 flex-1"
                data-testid="invite-email"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded text-xs px-2"
                data-testid="invite-role"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button
                disabled={busy}
                onClick={handleInvite}
                className="bg-white text-zinc-950 hover:bg-zinc-200"
                data-testid="send-invite-btn"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 px-1">
            Members ({members.length})
          </div>
          <ul className="space-y-1">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center gap-3 px-2 py-2 rounded hover:bg-zinc-900"
                data-testid={`member-${m.user_id}`}
              >
                <div className="w-7 h-7 rounded-full bg-zinc-800 grid place-items-center text-xs overflow-hidden">
                  {m.picture ? (
                    <img src={m.picture} alt={m.email} className="w-full h-full object-cover" />
                  ) : (
                    (m.email || "?")[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{m.name || m.email}</div>
                  <div className="text-[11px] text-zinc-500 font-mono truncate">{m.email}</div>
                </div>
                {m.role === "owner" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-[10px] uppercase tracking-widest font-mono">
                    <Crown className="w-3 h-3" /> Owner
                  </span>
                ) : isOwner ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded text-[11px] px-2 h-7"
                      data-testid={`member-role-${m.user_id}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      data-testid={`remove-member-${m.user_id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">
                    {m.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-200"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
