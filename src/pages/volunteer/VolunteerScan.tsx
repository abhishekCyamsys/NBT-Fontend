import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, QrCode, CheckCircle, AlertCircle, X, User, Users, ShieldAlert, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { apiService, VisitorEvent, VolunteerGateStats } from '../../services/api';

type ScanStatus = 'idle' | 'valid' | 'invalid' | 'already_entered' | 'error';

function getOrCreateId(storageKey: string) {
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `dev-${Date.now()}`;
  localStorage.setItem(storageKey, next);
  return next;
}

export default function VolunteerScan() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [qrToken, setQrToken] = useState('');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [visitorInfo, setVisitorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [eventId, setEventId] = useState<string>(() => localStorage.getItem('scan_event_id') ?? '');
  const [gateNumber, setGateNumber] = useState<number>(() => Number(localStorage.getItem('scan_gate_number') ?? '1'));
  const [deviceId] = useState(() => getOrCreateId('scan_device_id'));
  const [scanDeviceId] = useState(() => localStorage.getItem('scan_scan_device_id') ?? 'web-scanner');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState<VolunteerGateStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = async () => {
    if (!eventId) return;
    try {
      setStatsLoading(true);
      const data = await apiService.getVolunteerGateStats(eventId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('volunteer_jwt');
    if (!token) {
      window.location.replace('/volunteer/login');
      return;
    }
    apiService.getVolunteerEvents()
      .then((data) => {
         setEvents(data);
         if (data.length > 0 && !eventId) {
           const eid = data[0].id || data[0].eventId;
           setEventId(eid);
           localStorage.setItem('scan_event_id', eid);
         }
      })
      .catch((err) => console.error("Failed to fetch events", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('scan_event_id', eventId);
    if (eventId) fetchStats();
  }, [eventId]);

  useEffect(() => {
    localStorage.setItem('scan_gate_number', String(gateNumber));
  }, [gateNumber]);

  useEffect(() => {
    localStorage.setItem('scan_scan_device_id', scanDeviceId);
  }, [scanDeviceId]);

  const statusStyle = useMemo(() => {
    switch (status) {
      case 'valid':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
      case 'invalid':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
      case 'already_entered':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' };
      case 'error':
        return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' };
      default:
        return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800' };
    }
  }, [status]);

  const resetReady = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = null;
    setResetCountdown(null);
    setQrToken('');
    setStatus('idle');
    setMessage('');
    setVisitorInfo(null);
    inputRef.current?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qrToken.trim()) return;
    setLoading(true);
    setMessage('');
    setVisitorInfo(null);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setResetCountdown(null);

    try {
      const res = await apiService.volunteerScan({
        qrToken: qrToken.trim(),
        eventId: eventId.trim(),
        scanDeviceId,
        gateNumber,
      });

      if (res.valid) {
        setStatus('valid');
        setMessage(res.message || 'Valid Ticket — Entry recorded');
        setVisitorInfo(res.visitor || res.data?.visitor || null);
        showToast(res.message || "Entry marked successfully!", "success");
        fetchStats(); // Update entry count immediately

        // Auto-reset after 3 seconds
        setResetCountdown(3);
        const timer = setInterval(() => {
          setResetCountdown(prev => (prev !== null && prev > 1 ? prev - 1 : null));
        }, 1000);

        resetTimerRef.current = setTimeout(() => {
          clearInterval(timer);
          resetReady();
        }, 3000);
      } else {
        setStatus('error');
        setMessage(res.message || 'Scan failed');
        showToast(res.message || "Invalid ticket", "error");
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Scan failed. Please retry.');
      showToast(err?.message || 'Scan network error', "error");
      
      // If it's a duplicate scan error, update stats to show the incremented duplicate count
      if (err?.status === 409) {
        fetchStats();
      }
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    setCameraOn(false);
  };

  const startCamera = () => {
    setMessage('');
    setStatus('idle');
    setCameraOn(true);
  };

  useEffect(() => {
    let active = true;

    const setupCamera = async () => {
      if (!cameraOn) {
        controlsRef.current?.stop();
        controlsRef.current = null;
        inputRef.current?.focus();
        return;
      }

      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      const reader = readerRef.current;
      const video = videoRef.current;
      if (!reader || !video) return;

      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const selected = devices.length > 0 ? devices[0].deviceId : undefined;
        
        controlsRef.current = await reader.decodeFromVideoDevice(selected, video, (result, err) => {
          if (!active) return;
          if (result) {
            const text = result.getText();
            setQrToken(text);
            stopCamera();
            setTimeout(() => {
               void submit({ preventDefault: () => {} } as React.FormEvent);
            }, 100);
            return;
          }
          if (err && !(err instanceof NotFoundException)) {
            setStatus('error');
            setMessage('Camera scan error. Try again.');
          }
        });
      } catch (e: any) {
        if (active) {
          setStatus('error');
          setMessage(e?.message || 'Camera permission denied or not available.');
          stopCamera();
        }
      }
    };

    void setupCamera();

    return () => {
      active = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [cameraOn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-fuchsia-50 to-white px-4 py-8 sm:px-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xl animate-in slide-in-from-top-8 fade-in slide-out-to-top-8 duration-300">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{toast.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-xs text-gray-600">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/volunteer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-gray-900">Scan QR Ticket</p>
            <p className="text-xs text-gray-600">Fast feedback for gates</p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Entries</p>
              <div className="flex items-center gap-2">
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-300" /> : <p className="text-lg font-bold text-gray-900">{stats?.totalEntriesToday ?? 0}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blocked</p>
              <div className="flex items-center gap-2">
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-300" /> : <p className="text-lg font-bold text-gray-900">{stats?.duplicatesBlocked ?? 0}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-primary focus:outline-none bg-white truncate"
                required
              >
                <option value="">Select an Event</option>
                {events.map((ev) => (
                  <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>{ev.slug || ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gate Number</label>
              <input
                value={String(gateNumber)}
                onChange={(e) => setGateNumber(Math.max(1, Number(e.target.value || '1')))}
                inputMode="numeric"
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-primary focus:outline-none"
                placeholder="2"
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => (cameraOn ? stopCamera() : void startCamera())}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              <Camera className="h-4 w-4" />
              {cameraOn ? 'Stop Camera' : 'Scan with Camera'}
            </button>
            <p className="text-xs text-gray-500 self-center hidden sm:block">
              Device: <span className="font-mono">{deviceId}</span>
            </p>
          </div>

          {cameraOn && (
            <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-black">
              <video ref={videoRef} className="h-64 w-full object-cover sm:h-80" muted playsInline />
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              QR Token
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QrCode className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-3 pl-10 text-base focus:border-primary focus:outline-none"
                  placeholder="Paste or auto-scan QR payload"
                  inputMode="text"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !qrToken.trim() || !eventId.trim()}
                className="shrink-0 rounded-lg bg-primary px-6 py-3 text-base font-bold text-white shadow transition hover:bg-primary-dark disabled:opacity-50 min-w-[120px]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Mark Entry'}
              </button>
            </div>
          </form>

          <div className={`mt-6 rounded-2xl border p-5 transition-colors duration-300 ${statusStyle.bg} ${statusStyle.border}`}>
            <div className="flex items-center justify-between">
              <p className={`font-bold text-lg ${statusStyle.text}`}>
                {status === 'idle' ? 'Ready for next ticket scan' : message}
              </p>
              {resetCountdown !== null && (
                <span className="text-xs font-bold bg-black/5 px-2 py-1 rounded-md text-gray-500">
                  Resetting in {resetCountdown}s...
                </span>
              )}
            </div>
            
            {visitorInfo && (
              <div className="mt-4 bg-white/60 p-4 rounded-xl border border-black/5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 truncate">{visitorInfo.name || 'Visitor Name'}</h4>
                  <p className="text-sm font-medium text-gray-600">
                    {visitorInfo.mobileNumber || 'N/A'} • {visitorInfo.ticketType ? `Type: ${visitorInfo.ticketType}` : (visitorInfo.age ? `Age: ${visitorInfo.age}` : 'Attendee')}
                  </p>
                  {visitorInfo.city && <p className="text-xs text-gray-500 mt-1">City: {visitorInfo.city}</p>}
                </div>
              </div>
            )}

            {status !== 'idle' && (
              <button
                onClick={resetReady}
                className="mt-4 w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Reset Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

