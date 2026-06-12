import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Plus, Trash2, Download, Filter } from 'lucide-react';
import { supabase, getUser } from '~/lib/supabase';
import { getDocuments, deleteDocument, getDocumentSignedUrl, getVaultStats } from '~/server/documents';

export const Route = createFileRoute('/vault')({
  component: VaultPage,
});

export function VaultPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [categoryInput, setCategoryInput] = useState('');

  const { data: user } = useSuspenseQuery({
    queryKey: ['user'],
    queryFn: () => getUser(),
  });

  const { data: documents } = useSuspenseQuery({
    queryKey: ['documents', user?.id, selectedCategory],
    queryFn: () =>
      user ? getDocuments(user.id, selectedCategory ? { category: selectedCategory } : undefined) : Promise.resolve([]),
    enabled: !!user,
  });

  const { data: vaultStats } = useSuspenseQuery({
    queryKey: ['vaultStats', user?.id],
    queryFn: () => (user ? getVaultStats(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  const handleUpload = async () => {
    if (!user || !fileInput) return;

    try {
      // Upload file to storage
      const { uploadDocument } = await import('~/lib/supabase');
      await uploadDocument(user.id, fileInput, categoryInput || undefined);
      
      setFileInput(null);
      setCategoryInput('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!user) return;
    try {
      await deleteDocument(user.id, documentId);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleDownload = async (documentId: string) => {
    if (!user) return;
    try {
      const url = await getDocumentSignedUrl(user.id, documentId, 3600);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const categories = Object.keys(vaultStats?.categoryCounts || {});
  const filteredDocs = selectedCategory
    ? documents?.filter((d) => d.category === selectedCategory)
    : documents;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Vault</h1>
          <p className="text-muted-foreground">Securely store and manage your important documents</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Add a new document to your private vault</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Choose File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor="doc-category">Category (Optional)</Label>
                <Input
                  id="doc-category"
                  placeholder="e.g., Tax Documents, Insurance"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
              </div>
              <Button onClick={handleUpload} className="w-full" disabled={!fileInput}>
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vault Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vaultStats?.totalDocuments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(vaultStats?.totalSize || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === undefined ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(undefined)}
              >
                All Documents
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({vaultStats?.categoryCounts[category] || 0})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents
            {selectedCategory && ` - ${selectedCategory}`}
          </CardTitle>
          <CardDescription>{filteredDocs?.length || 0} document(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocs && filteredDocs.length > 0 ? (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {doc.category && <span>{doc.category}</span>}
                      {doc.size && <span>{formatFileSize(doc.size)}</span>}
                      <span>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No documents found</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first document to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">🔒 Privacy Secured</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All documents in your vault are encrypted and private. Only you can access them. Files are stored securely in your personal storage bucket with strict access controls.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
