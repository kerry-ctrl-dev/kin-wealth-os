import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Upload, Trash2, Download, FolderLock } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "Vault — Wealth OS" }] }),
  component: VaultPage,
});

function VaultPage() {
  const qc = useQueryClient();
  const { data: docs } = useQuery(documentsQuery());
  const [category, setCategory] = useState("General");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setUploading(false); return; }
    const path = `${u.user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { error: dbErr } = await supabase.from("documents").insert({
      user_id: u.user.id, name: file.name, file_path: path, category, size_bytes: file.size, mime_type: file.type,
    });
    setUploading(false);
    if (dbErr) toast.error(dbErr.message);
    else { toast.success("Uploaded"); qc.invalidateQueries({ queryKey: ["documents"] }); }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function download(path: string, name: string) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (error || !data) return toast.error(error?.message ?? "Failed");
    const a = document.createElement("a"); a.href = data.signedUrl; a.download = name; a.click();
  }

  async function del(id: string, path: string) {
    await supabase.storage.from("documents").remove([path]);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["documents"] }); }
  }

  return (
    <div>
      <SectionHeading title="Document Vault" sub="Secure private storage for your financial documents." />
      <div className="fintech-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1"><label className="text-xs uppercase tracking-widest text-muted-foreground">Category</label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Statements, Receipts, …" /></div>
          <div>
            <input ref={fileRef} type="file" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}</Button>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(docs ?? []).map((d) => (
          <div key={d.id} className="fintech-card p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md grid place-items-center bg-primary/15 text-primary"><FolderLock className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.category} · {Math.round(Number(d.size_bytes ?? 0) / 1024)} KB</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => download(d.file_path, d.name)} className="text-muted-foreground hover:text-primary"><Download className="h-4 w-4" /></button>
              <button onClick={() => del(d.id, d.file_path)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {(!docs || docs.length === 0) && <p className="text-sm text-muted-foreground col-span-full">No documents yet — upload PDFs, statements, receipts and they stay private to you.</p>}
      </div>
    </div>
  );
}