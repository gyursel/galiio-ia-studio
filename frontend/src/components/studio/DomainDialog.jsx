import React, { useState } from "react";
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
import { connectDomain, disconnectDomain } from "@/lib/api";
import { toast } from "sonner";
import { Globe, Copy, Check } from "lucide-react";

export default function DomainDialog({ open, onOpenChange, projectId, currentDomain, onUpdate }) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [busy, setBusy] = useState(false);
  const [records, setRecords] = useState(null);
  const [copied, setCopied] = useState("");

  const handleConnect = async () => {
    setBusy(true);
    try {
      const res = await connectDomain(projectId, domain);
      setRecords(res.dns_records);
      toast.success(`MOCKED: ${res.domain} connected`);
      onUpdate?.(res.domain);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectDomain(projectId);
      setDomain("");
      setRecords(null);
      onUpdate?.(null);
      toast.success("Domain disconnected");
    } finally {
      setBusy(false);
    }
  };

  const copy = (val) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(val);
      setTimeout(() => setCopied(""), 1200);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg tracking-tight inline-flex items-center gap-2">
            <Globe className="w-4 h-4" /> Custom domain
            <span className="ml-auto text-[10px] font-mono text-zinc-500">MOCKED</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Point your domain to Galio. Add the DNS records below at your registrar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yoursite.com"
              className="bg-zinc-900 border-zinc-800"
              data-testid="domain-input"
            />
            <Button
              disabled={busy || !domain.trim()}
              onClick={handleConnect}
              className="bg-white text-zinc-950 hover:bg-zinc-200"
              data-testid="connect-domain-btn"
            >
              {busy ? "…" : "Connect"}
            </Button>
          </div>
          {records && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Host</th>
                    <th className="text-left p-2">Value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-t border-zinc-900">
                      <td className="p-2 font-mono">{r.type}</td>
                      <td className="p-2 font-mono">{r.host}</td>
                      <td className="p-2 font-mono">{r.value}</td>
                      <td className="p-2">
                        <button
                          onClick={() => copy(r.value)}
                          className="text-zinc-500 hover:text-white"
                          data-testid={`copy-dns-${i}`}
                        >
                          {copied === r.value ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          {currentDomain && (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              disabled={busy}
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-red-400 hover:text-red-300"
              data-testid="disconnect-domain-btn"
            >
              Disconnect
            </Button>
          )}
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
