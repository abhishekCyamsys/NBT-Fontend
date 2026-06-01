import { useEffect, useState, useRef } from 'react';
import { CalendarPlus, Trash2, Edit2, FileUp, X, RefreshCw, Plus, Upload } from 'lucide-react';
import { apiService, type EventSession, type CreateSessionDto, type UpdateSessionPayload } from '../../services/api';
import Loader from '../../components/Loader';
import { useEventContext } from '../../context/EventContext';

interface SessionFormState {
  title: string;
  description: string;
  category: string;
  speaker: string;
  venue: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  organizer: string;
  status: string;
}

export default function SessionsPage() {
  const { activeEventId } = useEventContext();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(false);

  // S3 Session Images State
  const [sessionImages, setSessionImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Create / Edit Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionFormState>({
    title: '',
    description: '',
    category: 'Children Activities',
    speaker: '',
    venue: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    organizer: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);

  // Categories
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const availableCategories = Array.from(new Set([...categories.map(c => c.name), ...sessions.map(s => s.category)]));

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // CSV Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Global Alert Modal
  const [modalMessage, setModalMessage] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  // Selection
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  
  // Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<{ 
    title: string; 
    message: string; 
    onConfirm: () => void;
    actionLabel?: string;
    isDanger?: boolean;
  } | null>(null);

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (activeEventId) {
      void loadSessions(activeEventId);
    } else {
      setSessions([]);
    }
  }, [activeEventId]);

  const loadCategories = async () => {
    try {
      const data = await apiService.getAdminCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadSessions = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await apiService.getAdminSessions(eventId);
      setSessions(data);
    } catch (e) {
      console.error('Failed to load sessions', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedSessionIds.length === sessions.length && sessions.length > 0) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(sessions.map(s => s.id));
    }
  };

  const toggleSelectSession = (id: string) => {
    setSelectedSessionIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedSessionIds.length === 0) return;
    setConfirmConfig({
      title: 'Bulk Delete Sessions',
      message: `Are you sure you want to delete ${selectedSessionIds.length} selected sessions? This action cannot be undone.`,
      actionLabel: 'Delete Selected',
      isDanger: true,
      onConfirm: async () => {
        if (!activeEventId) return;
        try {
          await apiService.bulkDeleteAdminSessions(activeEventId, selectedSessionIds);
          setSessions(prev => prev.filter(s => !selectedSessionIds.includes(s.id)));
          setSelectedSessionIds([]);
          setModalMessage({ title: 'Success', message: 'Selected sessions deleted successfully.', type: 'success' });
        } catch (er) {
          const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to delete sessions';
          setModalMessage({ title: 'Error', message: msg, type: 'error' });
        }
        setConfirmConfig(null);
      }
    });
  };

  const handleOpenCreate = () => {
    setForm({
      title: '',
      description: '',
      category: 'Children Activities',
      speaker: '',
      venue: '',
      sessionDate: '',
      startTime: '',
      endTime: '',
      organizer: '',
      status: 'active'
    });
    setSessionImages([]);
    setIsEditing(false);
    setEditSessionId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (session: EventSession) => {
    setForm({
      title: session.title,
      description: session.description || '',
      category: session.category,
      speaker: session.speaker || '',
      venue: session.venue || '',
      sessionDate: new Date(session.sessionDate).toISOString().split('T')[0],
      startTime: new Date(session.startTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(session.endTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      organizer: session.organizer || '',
      status: session.status
    });

    let imgs: string[] = [];
    if (session.sessionImageUrls) {
      try {
        imgs = JSON.parse(session.sessionImageUrls);
      } catch (e) {
        console.error('Failed to parse session images', e);
      }
    }
    setSessionImages(imgs);

    setIsEditing(true);
    setEditSessionId(session.id);
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { uploadUrl, imageUrl } = await apiService.getPresignedUploadUrl(file.name, file.type);
      
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      setSessionImages(prev => [...prev, imageUrl]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSessionImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId) return;
    setSaving(true);
    try {
      if (isEditing && editSessionId) {
        const updatePayload: UpdateSessionPayload = {
          title: form.title,
          description: form.description || '',
          category: form.category,
          speaker: form.speaker || '',
          venue: form.venue || '',
          sessionDate: new Date(form.sessionDate).toISOString(),
          startTime: new Date(`${form.sessionDate}T${form.startTime}:00`).toISOString(),
          endTime: new Date(`${form.sessionDate}T${form.endTime}:00`).toISOString(),
          organizer: form.organizer || '',
          status: form.status,
          sessionImageUrls: sessionImages,
        };
        await apiService.updateAdminSession(activeEventId, editSessionId, updatePayload);
      } else {
        const createPayload: CreateSessionDto = {
          date: form.sessionDate,
          activities: [
            {
              title: form.title,
              description: form.description || '',
              category: form.category,
              speaker: form.speaker || '',
              venue: form.venue || '',
              startTime: new Date(`${form.sessionDate}T${form.startTime}:00`).toISOString(),
              endTime: new Date(`${form.sessionDate}T${form.endTime}:00`).toISOString(),
              organizer: form.organizer || '',
            }
          ],
          images: sessionImages,
        };
        await apiService.createAdminSession(activeEventId, createPayload);
      }
      setIsFormOpen(false);
      await loadSessions(activeEventId);
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to save session';
      setModalMessage({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sessionId: string) => {
    setConfirmConfig({
      title: 'Delete Session',
      message: 'Are you sure you want to delete this session? This action cannot be undone.',
      actionLabel: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        if (!activeEventId) return;
        try {
          await apiService.deleteAdminSession(activeEventId, sessionId);
          setSessions((prev) => prev.filter(s => s.id !== sessionId));
          setSelectedSessionIds(prev => prev.filter(id => id !== sessionId));
        } catch (er) {
          const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to delete session';
          setModalMessage({ title: 'Error', message: msg, type: 'error' });
        }
        setConfirmConfig(null);
      }
    });
  };

  const handleImportClick = () => {
    if (!activeEventId) {
      setModalMessage({ title: 'Warning', message: 'Please select an event first.', type: 'error' });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEventId) return;

    setImporting(true);
    try {
      const res = await apiService.importAdminSessionsCsv(activeEventId, file);
      if (res.errors && res.errors.length > 0) {
        setModalMessage({
          title: 'Import Completed with Errors',
          message: `Imported ${res.importedCount} sessions.\n\nErrors:\n${res.errors.join('\n')}`,
          type: 'error'
        });
      } else {
        setModalMessage({
          title: 'Import Successful',
          message: `Successfully imported ${res.importedCount} sessions!`,
          type: 'success'
        });
      }
      await loadSessions(activeEventId);
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to import file';
      setModalMessage({ title: 'Import Failed', message: msg, type: 'error' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (name) {
      try {
        if (!categories.find(c => c.name === name)) {
          await apiService.createAdminCategory(name);
          await loadCategories();
        }
        setForm({ ...form, category: name });
        setNewCategoryName('');
        setIsAddCategoryOpen(false);
      } catch (er) {
        const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to add category';
        setModalMessage({ title: 'Error', message: msg, type: 'error' });
      }
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Event Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage daily schedules and activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv, .xls, .xlsx"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleImportClick}
            disabled={importing || !activeEventId}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {importing ? 'Importing...' : 'Import File'}
          </button>
          
          {selectedSessionIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedSessionIds.length})
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            disabled={!activeEventId}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" />
            Add Session
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold w-10 rounded-tl-2xl">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={sessions.length > 0 && selectedSessionIds.length === sessions.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Event/Session</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Venue</th>
                <th className="px-6 py-4 font-semibold">Speaker</th>
                <th className="px-6 py-4 font-semibold text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader size="md" />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No sessions found for this event.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedSessionIds.includes(session.id)}
                        onChange={() => toggleSelectSession(session.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{formatDate(session.sessionDate)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{session.title}</div>
                      {session.organizer && <div className="text-xs text-gray-500 mt-0.5">By {session.organizer}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {session.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{session.venue || '-'}</td>
                    <td className="px-6 py-4">{session.speaker || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(session)}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flyout Form */}
      <div
        className={`fixed inset-0 z-50 transform pointer-events-auto transition-transform duration-300 ease-in-out ${isFormOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${isFormOpen ? 'bg-black/30 opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl flex flex-col pointer-events-auto border-l border-gray-200">
          <div className="flex items-center justify-between border-b px-6 py-5 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Session' : 'Add Session'}</h2>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700 bg-gray-200 p-1.5 rounded-full hover:bg-gray-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <form id="sessionForm" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Event/Session <span className="text-red-500">*</span></label>
                <input required className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select required className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="" disabled>Select category</option>
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" onClick={() => setIsAddCategoryOpen(true)} className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 text-gray-600 hover:bg-gray-200 transition-colors" title="Add Category">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Date <span className="text-red-500">*</span></label>
                  <input type="date" required className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Start Time <span className="text-red-500">*</span></label>
                  <input type="time" required className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">End Time <span className="text-red-500">*</span></label>
                  <input type="time" required className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Speaker / Presenter</label>
                <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Venue / Location</label>
                <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Organizer</label>
                <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
                <textarea rows={3} className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Image Upload & Previews */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <label className="block text-xs font-semibold text-gray-700">Session Images</label>
                
                {/* Images Preview Strip */}
                {sessionImages.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {sessionImages.map((url, idx) => (
                      <div key={url} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                        <img src={url} alt={`Session image ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 rounded-full text-white transition-opacity shadow-sm"
                          title="Remove Image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <label className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingImage ? <RefreshCw className="h-4 w-4 animate-spin text-gray-500" /> : <Upload className="h-4 w-4 text-gray-500" />}
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  {uploadingImage && <span className="text-xs text-gray-400 animate-pulse">Uploading directly to S3...</span>}
                </div>
              </div>

            </form>
          </div>
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="sessionForm"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={() => setIsAddCategoryOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Add Category</h3>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-gray-700">Category Name</label>
              <input
                autoFocus
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="e.g. Workshop"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAddCategoryOpen(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleAddCategory} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={() => setModalMessage(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl flex flex-col">
            <h3 className={`text-lg font-bold ${modalMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {modalMessage.title}
            </h3>
            <div className="mt-2 text-sm text-gray-600 max-h-64 overflow-y-auto whitespace-pre-wrap">
              {modalMessage.message}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalMessage(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 transition-opacity" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl flex flex-col">
            <h3 className="text-lg font-bold text-gray-900">
              {confirmConfig.title}
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              {confirmConfig.message}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${confirmConfig.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'}`}
              >
                {confirmConfig.actionLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
