import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getDocuments, createDocument, attachDocumentFile, getDocumentTypes, Document } from '../lib/api';

export default function DocumentsPage() {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState<any>({
    profileId: '',
    documentTypeId: '',
    issueDate: '',
    expiryDate: '',
    identityNo: '',
    documentTitle: '',
    remarks: '',
    isSelf: true,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDocuments();
    getDocumentTypes().then((r) => setDocumentTypes(r.data));
  }, [isAuthenticated, page]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDocuments({ page });
      setDocuments(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        profileId: parseInt(form.profileId, 10),
        documentTypeId: parseInt(form.documentTypeId, 10),
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || undefined,
        identityNo: form.identityNo || undefined,
        documentTitle: form.documentTitle || undefined,
        remarks: form.remarks || undefined,
        isSelf: form.isSelf,
      };
      const created = await createDocument(payload);

      if (selectedFile && created.data.id) {
        await attachDocumentFile(created.data.id, selectedFile);
      }

      setShowCreate(false);
      setSelectedFile(null);
      setForm({ profileId: '', documentTypeId: '', issueDate: '', expiryDate: '', identityNo: '', documentTitle: '', remarks: '', isSelf: true });
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to create document');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-500 mt-1">Manage employee documents and expiry tracking.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          + Add Document
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Employee</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Issue Date</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Expiry Date</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No documents found.</td></tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.documentTitle || d.documentType?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{d.documentType?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{d.profile?.name} {d.profile?.lastName}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(d.issueDate)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(d.expiryDate)}</td>
                  <td className="px-6 py-4 text-gray-600">{d.files?.length || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Document</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="Profile ID" value={form.profileId} onChange={(e) => setForm({ ...form, profileId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <select required value={form.documentTypeId} onChange={(e) => setForm({ ...form, documentTypeId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Document Type</option>
                  {documentTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                </select>
              </div>
              <input placeholder="Document Title" value={form.documentTitle} onChange={(e) => setForm({ ...form, documentTitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" placeholder="Issue Date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="date" placeholder="Expiry Date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input placeholder="Identity No" value={form.identityNo} onChange={(e) => setForm({ ...form, identityNo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={3} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isSelf} onChange={(e) => setForm({ ...form, isSelf: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Self-service document
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
