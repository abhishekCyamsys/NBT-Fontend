import { useEffect, useState, useRef } from 'react';
import { CalendarPlus, Trash2, Edit2, FileUp, X, RefreshCw, Plus, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { apiService, type EventSession, type CreateSessionDto } from '../../services/api';
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

export default function SessionsPage() {
  const { activeEventId } = useEventContext();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(false);

  // S3 Session Images State
  const [sessionImages, setSessionImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<SessionFormState>({
    category: 'Children Activities',
    sessionDate: ''
  });
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
  const [originalEditKey, setOriginalEditKey] = useState<{ date: string; category: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([]);

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
      category: 'Children Activities',
      sessionDate: ''
    });
    setActivities([
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
    setSessionImages([]);
    setIsEditing(false);
    setOriginalEditKey(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (session: EventSession) => {
    const sessionDateStr = new Date(session.sessionDate).toISOString().split('T')[0];
    
    // Find all matching sessions on the same Date and Category to load them as a group of activities!
    const matching = sessions.filter(
      s => new Date(s.sessionDate).toISOString().split('T')[0] === sessionDateStr && s.category === session.category
    );

    setForm({
      category: session.category,
      sessionDate: sessionDateStr
    });

    setActivities(matching.map(s => {
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
    }));

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

    setIsEditing(true);
    setOriginalEditKey({
      date: sessionDateStr,
      category: session.category
    });
    setIsFormOpen(true);
  };

  const handleAddActivityBlock = () => {
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
  };

  const handleRemoveActivityBlock = (indexToRemove: number) => {
    setActivities(prev => prev.filter((_, i) => i !== indexToRemove));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId) return;
    setSaving(true);
    try {
      if (isEditing && originalEditKey) {
        const dateChanged = form.sessionDate !== originalEditKey.date;
        const categoryChanged = form.category !== originalEditKey.category;

        if (dateChanged || categoryChanged) {
          // If date or category changed, delete the original sessions first to avoid duplicates/orphans
          const originalSessions = sessions.filter(
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
      setIsFormOpen(false);
      await loadSessions(activeEventId);
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to save session';
      setModalMessage({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = (date: string, category: string, count: number, ids: string[]) => {
    setConfirmConfig({
      title: 'Delete Schedule Block',
      message: `Are you sure you want to delete all ${count} sessions under "${category}" on ${formatDate(date)}? This action cannot be undone.`,
      actionLabel: 'Delete All',
      isDanger: true,
      onConfirm: async () => {
        if (!activeEventId) return;
        try {
          await apiService.bulkDeleteAdminSessions(activeEventId, ids);
          setSessions((prev) => prev.filter(s => !ids.includes(s.id)));
          setSelectedSessionIds(prev => prev.filter(id => !ids.includes(id)));
        } catch (er) {
          const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to delete sessions';
          setModalMessage({ title: 'Error', message: msg, type: 'error' });
        }
        setConfirmConfig(null);
      }
    });
  };

  const handleDeleteDate = (date: string, count: number, ids: string[]) => {
    setConfirmConfig({
      title: 'Delete Date Schedule',
      message: `Are you sure you want to delete all ${count} sessions scheduled on ${formatDate(date)}? This action cannot be undone.`,
      actionLabel: 'Delete All',
      isDanger: true,
      onConfirm: async () => {
        if (!activeEventId) return;
        try {
          await apiService.bulkDeleteAdminSessions(activeEventId, ids);
          setSessions((prev) => prev.filter(s => !ids.includes(s.id)));
          setSelectedSessionIds(prev => prev.filter(id => !ids.includes(id)));
        } catch (er) {
          const msg = er && typeof er === 'object' && 'message' in er ? String((er as any).message) : 'Failed to delete sessions';
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

  interface CategoryGroup {
    categoryName: string;
    activities: EventSession[];
    timeRange: string;
    venue: string;
  }

  interface DateGroup {
    dateKey: string;
    formattedDate: string;
    dayOfWeek: string;
    overallTimeRange: string;
    totalCategoriesCount: number;
    totalSessionsCount: number;
    venues: string;
    categoryGroups: CategoryGroup[];
  }

  const getGroupedSessionsByDate = (sessionsList: EventSession[]): DateGroup[] => {
    const dateGroupsMap: Record<string, EventSession[]> = {};
    
    sessionsList.forEach(session => {
      const dateKey = new Date(session.sessionDate).toISOString().split('T')[0];
      if (!dateGroupsMap[dateKey]) {
        dateGroupsMap[dateKey] = [];
      }
      dateGroupsMap[dateKey].push(session);
    });

    return Object.entries(dateGroupsMap).map(([dateKey, list]) => {
      const sortedList = [...list].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      const minStart = sortedList[0]?.startTime;
      const maxEnd = sortedList[sortedList.length - 1]?.endTime;
      const overallTimeRange = minStart && maxEnd ? `${formatTime(minStart)} - ${formatTime(maxEnd)}` : '-';
      
      const uniqueVenues = Array.from(new Set(sortedList.map(s => s.venue).filter(Boolean)));
      const venuesDisplay = uniqueVenues.join(', ') || '-';
      
      const categoryMap: Record<string, EventSession[]> = {};
      sortedList.forEach(session => {
        if (!categoryMap[session.category]) {
          categoryMap[session.category] = [];
        }
        categoryMap[session.category].push(session);
      });

      const categoryGroups: CategoryGroup[] = Object.entries(categoryMap).map(([categoryName, actList]) => {
        const sortedActs = [...actList].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const catStart = sortedActs[0]?.startTime;
        const catEnd = sortedActs[sortedActs.length - 1]?.endTime;
        const catTimeRange = catStart && catEnd ? `${formatTime(catStart)} - ${formatTime(catEnd)}` : '-';
        const catVenues = Array.from(new Set(sortedActs.map(s => s.venue).filter(Boolean))).join(', ') || '-';

        return {
          categoryName,
          activities: sortedActs,
          timeRange: catTimeRange,
          venue: catVenues
        };
      });

      const dateObj = new Date(`${dateKey}T00:00:00`);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      return {
        dateKey,
        formattedDate,
        dayOfWeek,
        overallTimeRange,
        totalCategoriesCount: categoryGroups.length,
        totalSessionsCount: sortedList.length,
        venues: venuesDisplay,
        categoryGroups
      };
    }).sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroupKeys(prev =>
      prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
    );
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
                <th className="px-6 py-4 font-semibold">Schedule Date & Day</th>
                <th className="px-6 py-4 font-semibold">Overall Time</th>
                <th className="px-6 py-4 font-semibold">Categories</th>
                <th className="px-6 py-4 font-semibold">Total Sessions</th>
                <th className="px-6 py-4 font-semibold">Venue(s)</th>
                <th className="px-6 py-4 font-semibold text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader size="md" />
                  </td>
                </tr>
              </tbody>
            ) : sessions.length === 0 ? (
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No sessions found for this event.
                  </td>
                </tr>
              </tbody>
            ) : (
              getGroupedSessionsByDate(sessions).map((dateGroup) => {
                const allDateSessionIds = dateGroup.categoryGroups.flatMap(cg => cg.activities.map(a => a.id));
                const isAllDateSelected = allDateSessionIds.every(id => selectedSessionIds.includes(id));
                
                return (
                  <tbody key={dateGroup.dateKey} className="divide-y divide-gray-100 border-b border-gray-200/65 last:border-b-0">
                    <tr className="hover:bg-gray-50 transition-colors align-middle">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          checked={isAllDateSelected}
                          onChange={() => {
                            if (isAllDateSelected) {
                              setSelectedSessionIds(prev => prev.filter(id => !allDateSessionIds.includes(id)));
                            } else {
                              setSelectedSessionIds(prev => Array.from(new Set([...prev, ...allDateSessionIds])));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button 
                            type="button" 
                            onClick={() => toggleGroupExpand(dateGroup.dateKey)} 
                            className="p-1 hover:bg-gray-100 rounded mr-2 transition-colors inline-flex items-center text-gray-500 hover:text-gray-700"
                            title={expandedGroupKeys.includes(dateGroup.dateKey) ? "Collapse Details" : "Expand Details"}
                          >
                            {expandedGroupKeys.includes(dateGroup.dateKey) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 font-display text-sm">
                              {dateGroup.formattedDate}
                            </span>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5 bg-primary/10 px-1.5 py-0.5 rounded w-max">
                              {dateGroup.dayOfWeek} Schedule of Event
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{dateGroup.overallTimeRange}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {dateGroup.totalCategoriesCount} {dateGroup.totalCategoriesCount === 1 ? 'Category' : 'Categories'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                          {dateGroup.totalSessionsCount} {dateGroup.totalSessionsCount === 1 ? 'Session' : 'Sessions'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[180px]" title={dateGroup.venues}>
                        {dateGroup.venues}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeleteDate(dateGroup.dateKey, dateGroup.totalSessionsCount, allDateSessionIds)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Date Schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Collapsible Sub-Table showing the category sections and nested sessions inside this block */}
                    {expandedGroupKeys.includes(dateGroup.dateKey) && (
                      <tr className="bg-gray-50/20 border-t-0">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="border border-gray-200/80 rounded-xl bg-white shadow-sm p-6 space-y-6 ml-8 mr-2 my-1">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-3 flex justify-between items-center">
                              <span>SCHEDULE OF EVENTS DETAIL</span>
                              <span className="text-primary font-semibold lowercase font-normal">({dateGroup.totalSessionsCount} sessions across {dateGroup.totalCategoriesCount} categories)</span>
                            </div>
                            
                            <div className="space-y-8">
                              {dateGroup.categoryGroups.map((catGroup) => {
                                const allCatSessionIds = catGroup.activities.map(a => a.id);
                                const isAllCatSelected = allCatSessionIds.every(id => selectedSessionIds.includes(id));
                                
                                return (
                                  <div key={catGroup.categoryName} className="space-y-3 bg-gray-50/30 p-4 rounded-xl border border-gray-150 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                                      <div className="flex items-center gap-3">
                                        <input 
                                          type="checkbox"
                                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                          checked={isAllCatSelected}
                                          onChange={() => {
                                            if (isAllCatSelected) {
                                              setSelectedSessionIds(prev => prev.filter(id => !allCatSessionIds.includes(id)));
                                            } else {
                                              setSelectedSessionIds(prev => Array.from(new Set([...prev, ...allCatSessionIds])));
                                            }
                                          }}
                                        />
                                        <h3 className="text-sm font-bold text-gray-900 tracking-tight font-display">
                                          {catGroup.categoryName}
                                        </h3>
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                          {catGroup.timeRange}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleOpenEdit(catGroup.activities[0])}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-colors shadow-sm"
                                          title={`Edit ${catGroup.categoryName}`}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                          <span>Edit Block</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteGroup(dateGroup.dateKey, catGroup.categoryName, catGroup.activities.length, allCatSessionIds)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-white hover:bg-gray-100 border border-red-200 rounded-md transition-colors shadow-sm"
                                          title={`Delete ${catGroup.categoryName}`}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          <span>Delete Block</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                                      <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-200">
                                          <tr>
                                            <th className="px-4 py-2.5 font-bold w-8">Select</th>
                                            <th className="px-4 py-2.5 font-bold w-36">Time</th>
                                            <th className="px-4 py-2.5 font-bold">Event / Session</th>
                                            <th className="px-4 py-2.5 font-bold w-48">Speaker / Presenter</th>
                                            <th className="px-4 py-2.5 font-bold w-48">Venue</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium">
                                          {catGroup.activities.map((activity) => (
                                            <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors">
                                              <td className="px-4 py-3">
                                                <input 
                                                  type="checkbox" 
                                                  className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                                  checked={selectedSessionIds.includes(activity.id)}
                                                  onChange={() => toggleSelectSession(activity.id)}
                                                />
                                              </td>
                                              <td className="px-4 py-3 text-primary font-bold whitespace-nowrap">
                                                {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">{activity.title}</span>
                                                    {activity.organizer && (
                                                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        By {activity.organizer}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {activity.description && (
                                                    <p className="text-[11px] text-gray-500 italic leading-relaxed max-w-2xl bg-gray-50/60 p-1.5 rounded border border-gray-100/60 mt-1 font-normal">
                                                      {activity.description}
                                                    </p>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-gray-700 font-semibold">
                                                {activity.speaker || '-'}
                                              </td>
                                              <td className="px-4 py-3 text-gray-700">
                                                <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 font-bold text-gray-800">
                                                  {activity.venue || '-'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })
            )}
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

              {/* Dynamic Activities List */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Activities / Sessions Schedule</span>
                </div>

                <div className="space-y-6">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="border-2 border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3 relative">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Activity #{idx + 1}</h4>
                        {activities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveActivityBlock(idx)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove Activity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">Activity Title <span className="text-red-500">*</span></label>
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
                          <label className="mb-1 block text-xs font-semibold text-gray-700">Start Time <span className="text-red-500">*</span></label>
                          <input
                            type="time"
                            required
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            value={activity.startTime}
                            onChange={(e) => handleActivityFieldChange(idx, 'startTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-700">End Time <span className="text-red-500">*</span></label>
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
                          <label className="mb-1 block text-xs font-semibold text-gray-700">Speaker / Presenter</label>
                          <input
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            value={activity.speaker}
                            onChange={(e) => handleActivityFieldChange(idx, 'speaker', e.target.value)}
                            placeholder="e.g. Rajesh Pandey"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-700">Venue / Location</label>
                          <input
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            value={activity.venue}
                            onChange={(e) => handleActivityFieldChange(idx, 'venue', e.target.value)}
                            placeholder="e.g. Children Corner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">Organizer</label>
                        <input
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          value={activity.organizer}
                          onChange={(e) => handleActivityFieldChange(idx, 'organizer', e.target.value)}
                          placeholder="e.g. CYMSYS"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
                        <textarea
                          rows={2}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          value={activity.description}
                          onChange={(e) => handleActivityFieldChange(idx, 'description', e.target.value)}
                          placeholder="e.g. Description of session activities..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddActivityBlock}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:text-primary py-3 text-sm font-semibold text-gray-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Activity Block</span>
                </button>
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
