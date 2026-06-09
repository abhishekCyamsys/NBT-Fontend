import * as XLSX from 'xlsx';
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_BASE_URL = API_BASE_URL || import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3001";
const VISITOR_BASE_URL = API_BASE_URL || import.meta.env.VITE_VISITOR_BASE_URL || "http://localhost:3002";
const VOLUNTEER_BASE_URL = API_BASE_URL || import.meta.env.VITE_VOLUNTEER_BASE_URL || "http://localhost:3004";
const ADMIN_BASE_URL = API_BASE_URL || import.meta.env.VITE_ADMIN_BASE_URL || "http://localhost:3005";


const DEFAULT_EVENT_ID = import.meta.env.VITE_EVENT_ID || "";

const STORAGE_KEYS = {
  visitorJwt: "visitor_jwt",
  volunteerJwt: "volunteer_jwt",
  adminJwt: "admin_jwt",
} as const;

export type ApiError = { message: string; status?: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function httpJson<TResponse>(
  url: string,
  options: {
    method?: HttpMethod;
    headers?: HeadersInit;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<TResponse> {
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (isRecord(data)) {
      if (typeof data.message === "string") {
        message = data.message;
      } else if (Array.isArray(data.message) && data.message.length > 0 && typeof data.message[0] === "string") {
        message = data.message[0];
      } else if (typeof data.error === "string") {
        message = data.error;
      }
    }
    throw { message, status: res.status } satisfies ApiError;
  }

  return data as TResponse;
}

async function httpDownload(
  url: string,
  options: {
    headers?: HeadersInit;
    signal?: AbortSignal;
  } = {},
): Promise<void> {
  const res = await fetch(url, {
    method: "GET",
    headers: options.headers,
    signal: options.signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Download failed (${res.status})`;
    try {
      const data = JSON.parse(text);
      if (isRecord(data) && typeof data.error === "string") message = data.error;
    } catch { }
    throw { message, status: res.status } satisfies ApiError;
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  let filename = "download.csv";
  if (disposition && disposition.indexOf("filename=") !== -1) {
    const matches = /filename="([^"]+)"/.exec(disposition);
    if (matches && matches[1]) filename = matches[1];
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export type OtpPurpose = "visitor_registration";

export interface OtpRequestPayload {
  mobileNumber: string;
  purpose: OtpPurpose;
}

export interface OtpVerifyPayload {
  mobileNumber: string;
  otp: string;
}

export type OtpVerifyVisitorState =
  | "already_registered"
  | "existing_visitor_new_event"
  | "new_visitor";

export interface OtpVerifyResponse {
  case: string;
  accessToken: string; // visitor JWT
  visitor?: {
    visitorId: string;
    name?: string;
    mobileNumber?: string;
    age?: string;
    gender?: string;
    city?: string;
    email?: string;
  };
  registration: any;
}

export interface VisitorRegisterPayload {
  name: string;
  mobileNumber: string;
  gender?: "M" | "F" | "O";
  age: string; // e.g. "20-30"
  city?: string;
  email?: string;
  otpVerified: true;
}

export interface VisitorRegisterResponse {
  registrationId: string;
  passStatus: "processing" | "ready" | string;
}

export interface TicketsResponse {
  registrationId: string;
  status?: string;
  tickets: Array<{
    ticketId: string;
    ticketNumber?: string;
    ticketType?: "parent" | "child" | string;
    childId?: string | null;
    qrToken: string;
    status?: string;
    holderName?: string; // in case frontend overrides it
  }>;
  event?: {
    eventId: string;
    name: string;
    location?: string;
    venue?: string;
    description?: string;
    agenda?: string;
    bannerUrl?: string;
    slug?: string;
    baseUrl?: string;
    registerUrl?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

export interface VolunteerLoginPayload {
  email: string;
  password: string;
}

export interface VolunteerLoginResponse {
  accessToken: string; // volunteer JWT
}

export interface VolunteerRegisterPayload {
  name: string;
  mobileNumber: string;
  gender?: "m" | "f" | "o" | string;
  age: string;
  city?: string;
  email?: string;
  otpVerified?: boolean;
}

export interface VolunteerScanPayload {
  qrToken: string;
  eventId: string;
  scanDeviceId: string;
  gateNumber: number;
}

export interface VolunteerScanHistoryItem {
  id: string;
  entryTime: string;
  gateNumber: number;
  ticketType: string;
  passNumber: string;
  visitorName: string;
  visitorMobile: string;
}

export interface VolunteerGateStats {
  totalEntriesToday: number;
  duplicatesBlocked: number;
  lastScanTime: string | null;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
}

export interface AdminDashboardStats {
  totalVisitors: number;
  totalRegistrations: number;
  volunteerRegistrations: number;
  totalTickets: number;
  totalEntries: number;
  childrenTickets: number;
  visitorsPerDay: Array<{
    date: string;
    totalVisitors: number;
    morningVisitors?: number;
    eveningVisitors?: number;
  }>;
  visitorAgeDistribution?: Array<{
    age: string;
    count: number;
  }>;
  visitorGenderDistribution?: Array<{
    gender: string;
    count: number;
  }>;
  visitorsPerEvent: Array<{
    eventId: string;
    eventName: string;
    visitors: number;
    eventSlug?: string;
  }>;
  eventAnalytics: Array<{
    eventId: string;
    eventName: string;
    visitors: number;
    totalTickets: number;
    totalEntries: number;
    childrenTickets: number;
    volunteerRegistrations: number;
    slug?: string;
  }>;
}

export type AdminAnalytics = AdminDashboardStats;

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  category: string;
  speaker?: string;
  venue?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  organizer?: string;
  status: string;
  sessionImageUrls?: string;
}

export interface CreateSessionDto {
  date: string;
  images?: string[];
  activities: Array<{
    title: string;
    description?: string;
    category: string;
    speaker?: string;
    venue?: string;
    startTime: string;
    endTime: string;
    organizer?: string;
  }>;
}

export interface UpdateSessionPayload {
  title?: string;
  description?: string;
  category?: string;
  speaker?: string;
  venue?: string;
  sessionImageUrls?: string[];
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  organizer?: string;
  status?: string;
}

export interface SyncSessionDto {
  date: string;
  images?: string[];
  activities: Array<{
    id?: string;
    title: string;
    description?: string;
    category: string;
    speaker?: string;
    venue?: string;
    startTime: string;
    endTime: string;
    organizer?: string;
  }>;
}

export interface AdminVisitor {
  registrationId: string;
  eventId: string;
  eventName: string;
  eventSlug?: string;
  visitorId: string;
  name: string;
  mobileNumber: string;
  gender: "M" | "F" | "O" | string;
  age: string;
  city?: string;
  email?: string;
  registrationSource: "self_registration" | "volunteer_registration" | string;
  otpVerified: boolean;
  childCount: number;
  children: Array<{
    id: string;
    name: string;
    age: string;
  }>;
  createdAt: string;
}

export interface AdminVolunteer {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AdminCreateVolunteerPayload {
  name: string;
  email: string;
  password: string;
  mobileNumber: string;
}

export interface AdminEvent {
  id: string;
  eventName: string;
  location: string;
  venue?: string;
  description?: string;
  agenda?: string;
  bannerUrl?: string;
  slug?: string;
  startDate: string;
  endDate: string;
  status?: string;
  hasRegistrations?: boolean;
  registerUrl?: string;
  baseUrl?: string;
}

export interface VisitorEvent {
  id: string;
  name: string;
  location: string;
  venue?: string;
  description?: string;
  agenda?: string;
  bannerUrl?: string;
  slug?: string;
  startDate: string;
  endDate: string;
  eventId: string;
  registerUrl: string;
}


export interface AdminCreateEventPayload {
  name: string;
  location: string;
  venue?: string;
  description?: string;
  agenda?: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  status?: string;
}

export interface AdminEntry {
  entryLogId: string;
  ticketId: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  venue: string;
  scanDeviceId: string;
  deviceId: string;
  entryTime: string;
  scanStatus: string;
  visitorName: string;
  ticketType: string;
}

export interface AdminTicket {
  ticketId: string;
  id?: string;
  ticketNumber: string;
  passNumber?: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  venue?: string;
  visitorId: string;
  visitorName: string;
  ticketType: "parent" | "child" | string;
  status: "active" | "inactive" | string;
  issuedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


class ApiService {
  private getVisitorJwt(): string | null {
    return localStorage.getItem(STORAGE_KEYS.visitorJwt);
  }

  private getVolunteerJwt(): string | null {
    return localStorage.getItem(STORAGE_KEYS.volunteerJwt);
  }

  private getAdminJwt(): string | null {
    return localStorage.getItem(STORAGE_KEYS.adminJwt);
  }

  private eventHeader(eventSlug?: string): HeadersInit {
    const slug = eventSlug ?? DEFAULT_EVENT_ID;
    return slug ? { event_slug: slug } : {};
  }

  private eventIdHeader(eventSlug?: string): HeadersInit {
    const slug = eventSlug ?? DEFAULT_EVENT_ID;
    return slug ? { event_id: slug } : {};
  }

  async getPublicEventBySlug(slug: string) {
    return httpJson<{ id: string; eventName: string; location: string; startDate: string; endDate: string; description?: string; bannerUrl?: string; slug: string; }>(
      `${ADMIN_BASE_URL}/public/events/slug/${encodeURIComponent(slug)}`,
      { method: "GET" }
    );
  }

  async requestOtp(payload: OtpRequestPayload, eventSlug?: string) {
    return httpJson<{ success: boolean; message: string; data: any }>(`${AUTH_BASE_URL}/auth/otp/request`, {
      method: "POST",
      headers: eventSlug ? { ...this.eventHeader(eventSlug) } : {},
      body: payload,
    });
  }

  async verifyOtp(payload: OtpVerifyPayload, eventSlug?: string) {
    const res = await httpJson<OtpVerifyResponse>(
      `${AUTH_BASE_URL}/auth/otp/verify`,
      {
        method: "POST",
        headers: eventSlug ? { ...this.eventHeader(eventSlug) } : {},
        body: payload,
      },
    );
    if (res?.accessToken) {
      localStorage.setItem(STORAGE_KEYS.visitorJwt, res.accessToken);
    }
    return res;
  }

  async registerVisitor(payload: VisitorRegisterPayload, eventSlug?: string) {
    const jwt = this.getVisitorJwt();
    if (!jwt)
      throw {
        message: "Missing visitor token. Verify OTP first.",
      } satisfies ApiError;

    return httpJson<VisitorRegisterResponse>(
      `${VISITOR_BASE_URL}/visitors/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          ...(eventSlug ? this.eventHeader(eventSlug) : {})
        },
        body: payload,
      },
    );
  }

  async getTickets(registrationId: string) {
    return httpJson<TicketsResponse>(
      `${VISITOR_BASE_URL}/visitors/${encodeURIComponent(registrationId)}/tickets`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.getVisitorJwt() ?? ""}` },
      },
    );
  }

  async getVisitorEvents() {
    const jwt = this.getVisitorJwt();
    if (!jwt)
      throw { message: "Missing visitor token." } satisfies ApiError
    return httpJson<VisitorEvent[]>(`${VISITOR_BASE_URL}/visitors/events`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    });
  }

  async getVisitorProfile() {
    const jwt = this.getVisitorJwt();
    if (!jwt) throw { message: "Missing visitor token." } satisfies ApiError;
    return httpJson<{ id: string; name: string; mobileNumber: string; gender: string; age: string; city?: string; email?: string }>(
      `${VISITOR_BASE_URL}/visitors/profile`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );
  }

  async updateVisitorProfile(payload: Partial<{ name: string; gender: string; age: string; city: string; email: string }>) {
    const jwt = this.getVisitorJwt();
    if (!jwt) throw { message: "Missing visitor token." } satisfies ApiError;
    return httpJson<any>(`${VISITOR_BASE_URL}/visitors/profile`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${jwt}` },
      body: payload,
    });
  }

  async registerChildren(registrationId: string, payload: { children: Array<{ name: string; age: string }> }) {
    const jwt = this.getVisitorJwt();
    if (!jwt)
      throw { message: "Missing visitor token." } satisfies ApiError;
    return httpJson<{ passStatus: string; children: any[] }>(
      `${VISITOR_BASE_URL}/visitors/${encodeURIComponent(registrationId)}/children`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: payload,
      },
    );
  }

  async getEvent(eventId: string) {
    return httpJson<{ id: string; name: string; location: string; startDate: string; endDate: string; }>(
      `${VISITOR_BASE_URL}/events/${encodeURIComponent(eventId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.getAdminJwt() ?? this.getVisitorJwt() ?? ""}` },
      },
    );
  }

  async volunteerLogin(payload: VolunteerLoginPayload) {
    const res = await httpJson<VolunteerLoginResponse>(
      `${AUTH_BASE_URL}/auth/volunteer/login`,
      {
        method: "POST",
        body: payload,
      },
    );
    if (res?.accessToken) {
      localStorage.setItem(STORAGE_KEYS.volunteerJwt, res.accessToken);
    }
    return res;
  }

  async volunteerRegister(payload: VolunteerRegisterPayload, eventId?: string) {
    const jwt = this.getVolunteerJwt();
    if (!jwt)
      throw {
        message: "Missing volunteer token. Please login.",
      } satisfies ApiError;

    return httpJson<{ registrationId: string; passStatus: string }>(
      `${VOLUNTEER_BASE_URL}/volunteer/visitors/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          ...this.eventIdHeader(eventId),
        },
        body: payload,
      },
    );
  }

  async volunteerScan(payload: VolunteerScanPayload) {
    const jwt = this.getVolunteerJwt();
    if (!jwt)
      throw {
        message: "Missing volunteer token. Please login.",
      } satisfies ApiError;

    return httpJson<any>(
      `${VOLUNTEER_BASE_URL}/volunteer/scan`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: payload,
      },
    );
  }

  async getVolunteerEvents() {
    const jwt = this.getVolunteerJwt();
    if (!jwt) throw { message: 'Missing volunteer token.' } satisfies ApiError;
    return httpJson<VisitorEvent[]>(`${VOLUNTEER_BASE_URL}/volunteer/events`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    });
  }

  async getVolunteerScanHistory(eventId: string, gateNumber?: number, page = 1, limit = 20) {
    const jwt = this.getVolunteerJwt();
    if (!jwt) throw { message: 'Missing volunteer token.' } satisfies ApiError;
    const gateQuery = gateNumber ? `&gateNumber=${gateNumber}` : '';
    return httpJson<PaginatedResponse<VolunteerScanHistoryItem>>(
      `${VOLUNTEER_BASE_URL}/volunteer/scan-history?eventId=${eventId}&page=${page}&limit=${limit}${gateQuery}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );
  }

  async getVolunteerGateStats(eventId: string) {
    const jwt = this.getVolunteerJwt();
    if (!jwt) throw { message: 'Missing volunteer token.' } satisfies ApiError;
    return httpJson<VolunteerGateStats>(
      `${VOLUNTEER_BASE_URL}/volunteer/gate-stats?eventId=${eventId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );
  }

  async adminLogin(payload: AdminLoginPayload) {
    const res = await httpJson<AdminLoginResponse>(
      `${AUTH_BASE_URL}/auth/admin/login`,
      {
        method: "POST",
        body: payload,
      },
    );
    if (res?.accessToken) {
      localStorage.setItem(STORAGE_KEYS.adminJwt, res.accessToken);
    }
    return res;
  }

  private adminHeaders(): HeadersInit {
    const jwt = this.getAdminJwt();
    if (!jwt)
      throw {
        message: "Missing admin token. Please login.",
      } satisfies ApiError;
    return { Authorization: `Bearer ${jwt}` };
  }

  async getAdminDashboard(eventId?: string) {
    const query = eventId ? `?eventId=${eventId}` : '';
    return httpJson<AdminDashboardStats>(`${ADMIN_BASE_URL}/admin/dashboard${query}`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminAnalytics() {
    return this.getAdminDashboard();
  }

  async getAdminVisitors(page = 1, limit = 50, signal?: AbortSignal, eventId?: string) {
    const eventQuery = eventId ? `&eventId=${eventId}` : '';
    return httpJson<PaginatedResponse<AdminVisitor>>(`${ADMIN_BASE_URL}/admin/visitors?page=${page}&limit=${limit}${eventQuery}`, {
      method: "GET",
      headers: this.adminHeaders(),
      signal,
    });
  }

  async getAdminEntries(page = 1, limit = 50, signal?: AbortSignal, fields?: string[], eventId?: string) {
    const fieldsQuery = fields ? `&fields=${fields.join(",")}` : "";
    const eventQuery = eventId ? `&eventId=${eventId}` : '';
    return httpJson<PaginatedResponse<AdminEntry>>(`${ADMIN_BASE_URL}/admin/entries?page=${page}&limit=${limit}${fieldsQuery}${eventQuery}`, {
      method: "GET",
      headers: this.adminHeaders(),
      signal,
    });
  }

  async getAdminTickets(page = 1, limit = 50, signal?: AbortSignal, fields?: string[], eventId?: string) {
    const fieldsQuery = fields ? `&fields=${fields.join(",")}` : "";
    const eventQuery = eventId ? `&eventId=${eventId}` : '';
    const res = await httpJson<PaginatedResponse<AdminTicket>>(`${ADMIN_BASE_URL}/admin/tickets?page=${page}&limit=${limit}${fieldsQuery}${eventQuery}`, {
      method: "GET",
      headers: this.adminHeaders(),
      signal,
    });
    if (res && res.data) {
      res.data = res.data.map(t => ({
        ...t,
        id: t.ticketId,
        passNumber: t.ticketNumber
      }));
    }
    return res;
  }

  async getAdminVolunteers(page = 1, limit = 50, signal?: AbortSignal, fields?: string[]) {
    const fieldsQuery = fields ? `&fields=${fields.join(",")}` : "";
    return httpJson<PaginatedResponse<AdminVolunteer>>(`${ADMIN_BASE_URL}/admin/volunteers?page=${page}&limit=${limit}${fieldsQuery}`, {
      method: "GET",
      headers: this.adminHeaders(),
      signal,
    });
  }

  async createAdminVolunteer(payload: AdminCreateVolunteerPayload) {
    return httpJson<AdminVolunteer>(`${ADMIN_BASE_URL}/admin/volunteers`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async createAdminEvent(payload: AdminCreateEventPayload) {
    return httpJson<AdminEvent>(`${ADMIN_BASE_URL}/admin/events`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async updateAdminEvent(eventId: string, payload: Partial<AdminCreateEventPayload>) {
    return httpJson<AdminEvent>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async getAdminEvents() {
    return httpJson<AdminEvent[]>(`${ADMIN_BASE_URL}/admin/events`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminEventById(eventId: string) {
    return httpJson<AdminEvent>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async deactivateAdminEvent(eventId: string) {
    return httpJson<void>(
      `${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/deactivate`,
      {
        method: "POST",
        headers: this.adminHeaders(),
      },
    );
  }

  async deleteAdminEvent(eventId: string) {
    return httpJson<{ success: boolean }>(
      `${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: this.adminHeaders(),
      },
    );
  }

  async exportAdminVisitors(eventId?: string) {
    const eventQuery = eventId ? `?eventId=${eventId}` : '';
    return httpDownload(`${ADMIN_BASE_URL}/admin/visitors/export${eventQuery}`, {
      headers: this.adminHeaders(),
    });
  }

  async exportAdminVolunteers() {
    return httpDownload(`${ADMIN_BASE_URL}/admin/volunteers/export`, {
      headers: this.adminHeaders(),
    });
  }

  async exportAdminEntries(eventId?: string) {
    const eventQuery = eventId ? `?eventId=${eventId}` : '';
    return httpDownload(`${ADMIN_BASE_URL}/admin/entries/export${eventQuery}`, {
      headers: this.adminHeaders(),
    });
  }

  async exportAdminTickets(eventId?: string) {
    const eventQuery = eventId ? `?eventId=${eventId}` : '';
    return httpDownload(`${ADMIN_BASE_URL}/admin/tickets/export${eventQuery}`, {
      headers: this.adminHeaders(),
    });
  }

  // --- SESSION MANAGEMENT ---

  async getPublicSessions(slug: string, date?: string, category?: string) {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (category) params.append("category", category);

    const query = params.toString() ? `?${params.toString()}` : "";
    return httpJson<EventSession[]>(`${ADMIN_BASE_URL}/public/events/slug/${encodeURIComponent(slug)}/sessions${query}`);
  }

  async getAdminSessions(eventId: string, date?: string, category?: string) {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (category) params.append("category", category);

    const query = params.toString() ? `?${params.toString()}` : "";
    return httpJson<EventSession[]>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions${query}`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getPresignedUploadUrl(fileName: string, fileType: string) {
    return httpJson<{ uploadUrl: string, imageUrl: string }>(`${ADMIN_BASE_URL}/admin/sessions/presigned-url`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: { fileName, fileType },
    });
  }

  async createAdminSession(eventId: string, payload: CreateSessionDto) {
    return httpJson<EventSession[]>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async syncAdminSessions(eventId: string, payload: SyncSessionDto) {
    return httpJson<EventSession[]>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/sync`, {
      method: "PUT",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async updateAdminSession(eventId: string, sessionId: string, payload: UpdateSessionPayload) {
    return httpJson<EventSession>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async deleteAdminSession(eventId: string, sessionId: string) {
    return httpJson<{ success: boolean }>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: this.adminHeaders(),
    });
  }

  async bulkDeleteAdminSessions(eventId: string, sessionIds: string[]) {
    return httpJson<{ count: number }>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/bulk-delete`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: { sessionIds },
    });
  }

  async importAdminSessionsCsv(eventId: string, file: File) {
    let text = "";
    if (file.name.toLowerCase().endsWith('.csv')) {
      text = await file.text();
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      text = XLSX.utils.sheet_to_csv(worksheet);
    }

    return httpJson<{ success: boolean; importedCount: number; errors: string[] }>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/import`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: { csvContent: text },
    });
  }

  // --- CATEGORIES ---

  async getAdminCategories(): Promise<{ id: string; name: string }[]> {
    return httpJson<{ id: string; name: string }[]>(`${ADMIN_BASE_URL}/admin/categories`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async createAdminCategory(name: string): Promise<{ id: string; name: string }> {
    return httpJson<{ id: string; name: string }>(`${ADMIN_BASE_URL}/admin/categories`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: { name },
    });
  }

  logoutVisitor() {
    localStorage.removeItem(STORAGE_KEYS.visitorJwt);
  }

  logoutVolunteer() {
    localStorage.removeItem(STORAGE_KEYS.volunteerJwt);
  }

  logoutAdmin() {
    localStorage.removeItem(STORAGE_KEYS.adminJwt);
  }

  async getWhatsappSettings() {
    return httpJson<any>(`${ADMIN_BASE_URL}/admin/settings/whatsapp`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async updateWhatsappSettings(payload: any) {
    return httpJson<any>(`${ADMIN_BASE_URL}/admin/settings/whatsapp`, {
      method: "PATCH",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async getSmsSettings() {
    return httpJson<any>(`${ADMIN_BASE_URL}/admin/settings/sms`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async updateSmsSettings(payload: any) {
    return httpJson<any>(`${ADMIN_BASE_URL}/admin/settings/sms`, {
      method: "PATCH",
      headers: this.adminHeaders(),
      body: payload,
    });
  }
}

export const apiService = new ApiService();
