import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit2, X, RefreshCw, Plus, Upload, AlertCircle, Save } from 'lucide-react';
import { apiService, type CreateSessionDto } from '../../services/api';
import Loader from '../../components/Loader';
import { useEventContext } from '../../context/EventContext';

interface ActivityState {
  id?: string;
  title: string;
  description: string;
  speaker: string;
  venue: string;
  startTime: string;
  endTime: string;
  organizer: string;
}

interface SessionFormState {
  category: string;
  sessionDate: string;
}

export default function SessionFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeEventId } = useEventContext();

  const editDateParam = searchParams.get('date');
  const editCategoryParam = searchParams.get('category');
  const isEditing = !!(editDateParam && editCategoryParam);

  // Core Form State
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [form, setForm] = useState<SessionFormState>({
    category: 'Children Activities',
    sessionDate: ''
  });
  
  // Dynamic Activities
  const [activities, setActivities] = useState<ActivityState[]>([
    {
      title: '',
      description: '',
      speaker: '',
      venue: '',
      startTime: '',
      endTime: '',
      organizer: ''
    }
  ]);
  
  // Tracks which activity index is currently expanded for editing
  const [activeActivityIndex, setActiveActivityIndex] = useState<number>(0);
  
  // S3 Session Images State
  const [sessionImages, setSessionImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modals & Categories state
  const [originalEditKey, setOriginalEditKey] = useState<{ date: string; category: string } | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [modalMessage, setModalMessage] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  const availableCategories = Array.from(new Set([...categories.map(c => c.name), 'Children Activities', 'Literary Sessions', 'Cultural Programme']));

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (activeEventId && isEditing && editDateParam && editCategoryParam) {
      void loadSessionDataForEditing(activeEventId, editDateParam, editCategoryParam);
    }
  }, [activeEventId, isEditing, editDateParam, editCategoryParam]);

  const loadCategories = async () => {
    try {
      const data = await apiService.getAdminCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadSessionDataForEditing = async (eventId: string, dateStr: string, categoryStr: string) => {
    setLoadingData(true);
    try {
      const allSessions = await apiService.getAdminSessions(eventId);
      
      // Filter sessions matching target Date and Category
      const matching = allSessions.filter(s => {
        const sessionDateOnly = new Date(s.sessionDate).toISOString().split('T')[0];
        return sessionDateOnly === dateStr && s.category === categoryStr;
      });

      if (matching.length > 0) {
        setForm({
          category: categoryStr,
          sessionDate: dateStr
        });

        const loadedActivities = matching.map(s => {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime);
          const formatTimePart = (d: Date) => {
            return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          };
          return {
            id: s.id,
            title: s.title,
            description: s.description || '',
            speaker: s.speaker || '',
            venue: s.venue || '',
            startTime: formatTimePart(start),
            endTime: formatTimePart(end),
            organizer: s.organizer || '',
          };
        });

        setActivities(loadedActivities);
        setActiveActivityIndex(0); // expand first item

        // Load Images
        let imgs: string[] = [];
        const sessionWithImages = matching.find(s => s.sessionImageUrls);
        if (sessionWithImages && sessionWithImages.sessionImageUrls) {
          try {
            imgs = JSON.parse(sessionWithImages.sessionImageUrls);
          } catch (e) {
            console.error('Failed to parse session images', e);
          }
        }
        setSessionImages(imgs);

        setOriginalEditKey({
          date: dateStr,
          category: categoryStr
        });
      }
    } catch (e) {
      console.error('Failed to load session data for editing', e);
      setModalMessage({
        title: 'Error',
        message: 'Could not load the sessions data to edit.',
        type: 'error'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddActivityBlock = () => {
    // Validate the current active block first
    const currentAct = activities[activeActivityIndex];
    if (!currentAct) return;

    if (!currentAct.title.trim() || !currentAct.startTime || !currentAct.endTime) {
      setModalMessage({
        title: 'Required Fields Missing',
        message: `Please fill in the required fields (Activity Title, Start Time, and End Time) in Activity #${activeActivityIndex + 1} before creating a new block.`,
        type: 'error'
      });
      return;
    }

    // Add block and set it as active (expanded)
    setActivities(prev => [
      ...prev,
      {
        title: '',
        description: '',
        speaker: '',
        venue: '',
        startTime: '',
        endTime: '',
        organizer: ''
      }
    ]);
    setActiveActivityIndex(activities.length);
  };

  const handleRemoveActivityBlock = (indexToRemove: number) => {
    if (activities.length <= 1) return;
    
    setActivities(prev => prev.filter((_, i) => i !== indexToRemove));
    
    // Adjust active index if it was removed or out of bounds
    if (activeActivityIndex >= indexToRemove) {
      setActiveActivityIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleActivityFieldChange = (index: number, field: keyof ActivityState, value: string) => {
    setActivities(prev => prev.map((act, i) => {
      if (i === index) {
        return { ...act, [field]: value };
      }
      return act;
    }));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId) return;

    // Validate ALL blocks before saving
    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      if (!act.title.trim() || !act.startTime || !act.endTime) {
        setModalMessage({
          title: 'Required Fields Missing',
          message: `Activity #${i + 1} has missing required fields. Please fill in the Title, Start Time, and End Time before saving.`,
          type: 'error'
        });
        setActiveActivityIndex(i); // Auto expand the invalid one
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditing && originalEditKey) {
        const dateChanged = form.sessionDate !== originalEditKey.date;
        const categoryChanged = form.category !== originalEditKey.category;

        if (dateChanged || categoryChanged) {
          // If date or category changed, delete the original sessions first to avoid duplicates/orphans
          const allOldSessions = await apiService.getAdminSessions(activeEventId);
          const originalSessions = allOldSessions.filter(
            s => new Date(s.sessionDate).toISOString().split('T')[0] === originalEditKey.date && s.category === originalEditKey.category
          );
          if (originalSessions.length > 0) {
            const originalIds = originalSessions.map(s => s.id);
            await apiService.bulkDeleteAdminSessions(activeEventId, originalIds);
          }
          
          const createPayload: CreateSessionDto = {
            date: form.sessionDate,
            images: sessionImages,
            activities: activities.map(act => ({
              title: act.title,
              description: act.description || '',
              category: form.category,
              speaker: act.speaker || '',
              venue: act.venue || '',
              startTime: new Date(`${form.sessionDate}T${act.startTime}:00`).toISOString(),
              endTime: new Date(`${form.sessionDate}T${act.endTime}:00`).toISOString(),
              organizer: act.organizer || '',
            }))
          };
          await apiService.createAdminSession(activeEventId, createPayload);
        } else {
          const syncPayload: any = {
            date: form.sessionDate,
            images: sessionImages,
            activities: activities.map(act => ({
              id: act.id,
              title: act.title,
              description: act.description || '',
              category: form.category,
              speaker: act.speaker || '',
              venue: act.venue || '',
              startTime: new Date(`${form.sessionDate}T${act.startTime}:00`).toISOString(),
              endTime: new Date(`${form.sessionDate}T${act.endTime}:00`).toISOString(),
              organizer: act.organizer || '',
            }))
          };
          await apiService.syncAdminSessions(activeEventId, syncPayload);
        }
      } else {
        const createPayload: CreateSessionDto = {
          date: form.sessionDate,
          images: sessionImages,
          activities: activities.map(act => ({
            title: act.title,
            description: act.description || '',
            category: form.category,
            speaker: act.speaker || '',
            venue: act.venue || '',
            startTime: new Date(`${form.sessionDate}T${act.startTime}:00`).toISOString(),
            endTime: new Date(`${form.sessionDate}T${act.endTime}:00`).toISOString(),
            organizer: act.organizer || '',
          })),
        };
        await apiService.createAdminSession(activeEventId, createPayload);
      }
      navigate('/admin/sessions');
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to save session';
      setModalMessage({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      const [hour, min] = timeStr.split(':');
      const hourNum = parseInt(hour, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = hourNum % 12 || 12;
      return `${formattedHour}:${min} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/sessions')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 bg-white shadow-sm"
            title="Back to Sessions"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Session Block' : 'Add New Session Block'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isEditing 
                ? `Edit schedule block details for ${form.category} on ${form.sessionDate}`
                : 'Create a new category schedule date block with multiple activities.'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/sessions')}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-24">
          <Loader size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Block Group Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Category <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select 
                      required 
                      disabled={isEditing}
                      className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500" 
                      value={form.category} 
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="" disabled>Select category</option>
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {!isEditing && (
                      <button 
                        type="button" 
                        onClick={() => setIsAddCategoryOpen(true)} 
                        className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 text-gray-600 hover:bg-gray-200 transition-colors" 
                        title="Add Category"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    required 
                    disabled={isEditing}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                    value={form.sessionDate} 
                    onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Activities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-gray-900 uppercase tracking-wider">Activities Schedule ({activities.length})</h3>
                <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded-full">Only one expanded at a time</span>
              </div>

              <div className="space-y-4">
                {activities.map((activity, idx) => {
                  const isExpanded = idx === activeActivityIndex;

                  if (!isExpanded) {
                    // Render Collapsed Summary Preview Card
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveActivityIndex(idx)}
                        className="group border border-gray-200 bg-white rounded-xl p-4 flex justify-between items-center hover:border-primary hover:shadow-sm cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-gray-900 truncate max-w-[240px]">
                                {activity.title || `Untitled Activity #${idx + 1}`}
                              </span>
                              {activity.organizer && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {activity.organizer}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="font-bold text-primary">
                                {formatDisplayTime(activity.startTime)} - {formatDisplayTime(activity.endTime)}
                              </span>
                              {activity.venue && (
                                <span>• <strong className="text-gray-600 font-normal">Venue:</strong> {activity.venue}</span>
                              )}
                              {activity.speaker && (
                                <span>• <strong className="text-gray-600 font-normal">Speaker:</strong> {activity.speaker}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActivityIndex(idx);
                            }}
                            className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                            title="Expand Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {activities.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveActivityBlock(idx);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Activity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Render Expanded Active Form Block
                  return (
                    <div key={idx} className="border-2 border-primary rounded-xl p-5 bg-white shadow-sm space-y-4 relative">
                      <div className="flex justify-between items-center border-b border-gray-150 pb-2.5 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Expanded Activity Editor</h4>
                        </div>
                        {activities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveActivityBlock(idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                            title="Remove Activity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Activity Title <span className="text-red-500">*</span></label>
                          <input
                            required
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            value={activity.title}
                            onChange={(e) => handleActivityFieldChange(idx, 'title', e.target.value)}
                            placeholder="e.g. Storytelling session"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Start Time <span className="text-red-500">*</span></label>
                            <input
                              type="time"
                              required
                              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              value={activity.startTime}
                              onChange={(e) => handleActivityFieldChange(idx, 'startTime', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">End Time <span className="text-red-500">*</span></label>
                            <input
                              type="time"
                              required
                              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              value={activity.endTime}
                              onChange={(e) => handleActivityFieldChange(idx, 'endTime', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Speaker / Presenter</label>
                            <input
                              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              value={activity.speaker}
                              onChange={(e) => handleActivityFieldChange(idx, 'speaker', e.target.value)}
                              placeholder="e.g. Rajesh Pandey"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Venue / Location</label>
                            <input
                              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              value={activity.venue}
                              onChange={(e) => handleActivityFieldChange(idx, 'venue', e.target.value)}
                              placeholder="e.g. Children Corner"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Organizer</label>
                          <input
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            value={activity.organizer}
                            onChange={(e) => handleActivityFieldChange(idx, 'organizer', e.target.value)}
                            placeholder="e.g. CYMSYS"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                          <textarea
                            rows={3}
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            value={activity.description}
                            onChange={(e) => handleActivityFieldChange(idx, 'description', e.target.value)}
                            placeholder="e.g. Description of session activities..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddActivityBlock}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-primary hover:text-primary py-4 text-sm font-bold text-gray-600 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                <span>Add Activity Block</span>
              </button>
            </div>
          </div>

          {/* Right sidebar: S3 Image Upload & Summary Previews */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-md font-bold text-gray-900 border-b border-gray-150 pb-2.5 uppercase tracking-wider">Session Images</h2>
              
              {/* Images Preview Strip */}
              {sessionImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {sessionImages.map((url, idx) => (
                    <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                      <img src={url} alt={`Session image ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all shadow-sm"
                        title="Remove Image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-250 rounded-xl">
                  No images uploaded yet.
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-2 pt-2">
                <label className={`w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
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
                {uploadingImage && <div className="text-[10px] text-center text-gray-400 animate-pulse font-medium">Uploading directly to S3 bucket...</div>}
              </div>
            </div>

            {/* Sidebar quick guide info */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-150 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h4 className="text-sm font-bold">Quick Scheduler Guide</h4>
              </div>
              <ul className="text-xs text-blue-600 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                <li>All activities will be bundled under the selected Date & Category.</li>
                <li>Ensure required fields marked with <span className="text-red-500">*</span> are filled out in each activity.</li>
                <li>Collapse completed activity blocks to preview them clearly and focus on the current draft block.</li>
                <li>Upload calendar images to associate them with this category group event.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

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
            <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap max-h-62 overflow-y-auto font-medium">
              {modalMessage.message}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalMessage(null)}
                className="px-5 py-2 text-sm font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
