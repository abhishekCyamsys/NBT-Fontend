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
  volunteerRefreshToken: "volunteer_refresh_token",
  adminJwt: "admin_jwt",
  adminRefreshToken: "admin_refresh_token",
} as const;

export type ApiError = { message: string; status?: number };

function isApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "message" in error;
}

function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

type AuthRole = "admin" | "volunteer";

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
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
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
  refreshToken: string;
  expiresIn: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
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

export interface WhatsappEventConfig {
  id: string;
  whatsappNumber: string;
  eventId: string;
  eventName: string;
  eventSlug: string | null;
  eventStatus: string | null;
  childCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettings {
  eventBaseUrl: string;
  source: 'database' | 'environment';
  registerPath: string;
  exampleRegisterUrl: string | null;
  envFallback: string | null;
}

export interface UpdatePlatformSettingsPayload {
  eventBaseUrl: string;
  syncExistingEvents?: boolean;
}

export interface UpdatePlatformSettingsResult {
  eventBaseUrl: string;
  source: 'database';
  registerPath: string;
  syncedEventCount: number;
}

export interface CreateWhatsappEventConfigPayload {
  whatsappNumber: string;
  eventId: string;
  childCount: number;
  isActive?: boolean;
}

export interface UpdateWhatsappEventConfigPayload {
  whatsappNumber?: string;
  eventId?: string;
  childCount?: number;
  isActive?: boolean;
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
  private refreshLocks: Partial<Record<AuthRole, Promise<boolean> | null>> = {};

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
    if (res?.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.volunteerRefreshToken, res.refreshToken);
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
    if (res?.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.adminRefreshToken, res.refreshToken);
    }
    return res;
  }

  async ensureAdminSession(): Promise<boolean> {
    const jwt = this.getAdminJwt();
    const refreshToken = localStorage.getItem(STORAGE_KEYS.adminRefreshToken);
    if (!jwt || !refreshToken) {
      return false;
    }

    const expiry = getJwtExpiryMs(jwt);
    if (expiry && expiry - Date.now() > 5 * 60 * 1000) {
      return true;
    }

    return this.refreshSession("admin");
  }

  private persistAuthTokens(role: AuthRole, tokens: AuthTokenResponse) {
    if (role === "admin") {
      localStorage.setItem(STORAGE_KEYS.adminJwt, tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.adminRefreshToken, tokens.refreshToken);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.volunteerJwt, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.volunteerRefreshToken, tokens.refreshToken);
  }

  private clearAuthSession(role: AuthRole) {
    if (role === "admin") {
      localStorage.removeItem(STORAGE_KEYS.adminJwt);
      localStorage.removeItem(STORAGE_KEYS.adminRefreshToken);
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.volunteerJwt);
    localStorage.removeItem(STORAGE_KEYS.volunteerRefreshToken);
  }

  private getRefreshToken(role: AuthRole): string | null {
    return localStorage.getItem(
      role === "admin" ? STORAGE_KEYS.adminRefreshToken : STORAGE_KEYS.volunteerRefreshToken,
    );
  }

  private async refreshSession(role: AuthRole): Promise<boolean> {
    if (!this.refreshLocks[role]) {
      this.refreshLocks[role] = this.performRefresh(role).finally(() => {
        this.refreshLocks[role] = null;
      });
    }

    return this.refreshLocks[role]!;
  }

  private async performRefresh(role: AuthRole): Promise<boolean> {
    const refreshToken = this.getRefreshToken(role);
    if (!refreshToken) {
      return false;
    }

    try {
      const res = await httpJson<AuthTokenResponse>(`${AUTH_BASE_URL}/auth/refresh`, {
        method: "POST",
        body: { refreshToken },
      });

      if (!res?.accessToken || !res?.refreshToken) {
        this.clearAuthSession(role);
        return false;
      }

      this.persistAuthTokens(role, res);
      return true;
    } catch {
      this.clearAuthSession(role);
      return false;
    }
  }

  private async withAuthRetry<T>(role: AuthRole, request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        const refreshed = await this.refreshSession(role);
        if (refreshed) {
          return request();
        }
      }
      throw error;
    }
  }

  private async adminJson<T>(
    url: string,
    options: {
      method?: HttpMethod;
      headers?: HeadersInit;
      body?: unknown;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    return this.withAuthRetry("admin", () =>
      httpJson<T>(url, {
        ...options,
        headers: { ...this.adminHeaders(), ...(options.headers ?? {}) },
      }),
    );
  }

  private async adminDownload(
    url: string,
    options: {
      headers?: HeadersInit;
      signal?: AbortSignal;
    } = {},
  ): Promise<void> {
    return this.withAuthRetry("admin", () =>
      httpDownload(url, {
        ...options,
        headers: { ...this.adminHeaders(), ...(options.headers ?? {}) },
      }),
    );
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
    return this.adminJson<AdminDashboardStats>(`${ADMIN_BASE_URL}/admin/dashboard${query}`, {
      method: "GET",
      });
  }

  async getAdminAnalytics() {
    return this.getAdminDashboard();
  }

  async getAdminVisitors(page = 1, limit = 50, signal?: AbortSignal, eventId?: string) {
    const eventQuery = eventId ? `&eventId=${eventId}` : '';
    return this.adminJson<PaginatedResponse<AdminVisitor>>(`${ADMIN_BASE_URL}/admin/visitors?page=${page}&limit=${limit}${eventQuery}`, {
      method: "GET",
      signal,
    });
  }

  async getAdminEntries(page = 1, limit = 50, signal?: AbortSignal, fields?: string[], eventId?: string) {
    const fieldsQuery = fields ? `&fields=${fields.join(",")}` : "";
    const eventQuery = eventId ? `&eventId=${eventId}` : '';
    return this.adminJson<PaginatedResponse<AdminEntry>>(`${ADMIN_BASE_URL}/admin/entries?page=${page}&limit=${limit}${fieldsQuery}${eventQuery}`, {
      method: "GET",
      signal,
    });
  }

  async getAdminTickets(page = 1, limit = 50, signal?: AbortSignal, fields?: string[], eventId?: string) {
    const fieldsQuery = fields ? `&fields=${fields.join(",")}` : "";
    const eventQuery = eventId ? `&eventId=${eventId}` : '';
    const res = await this.adminJson<PaginatedResponse<AdminTicket>>(`${ADMIN_BASE_URL}/admin/tickets?page=${page}&limit=${limit}${fieldsQuery}${eventQuery}`, {
      method: "GET",
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
    return this.adminJson<PaginatedResponse<AdminVolunteer>>(`${ADMIN_BASE_URL}/admin/volunteers?page=${page}&limit=${limit}${fieldsQuery}`, {
      method: "GET",
      signal,
    });
  }

  async createAdminVolunteer(payload: AdminCreateVolunteerPayload) {
    return this.adminJson<AdminVolunteer>(`${ADMIN_BASE_URL}/admin/volunteers`, {
      method: "POST",
      body: payload,
    });
  }

  async createAdminEvent(payload: AdminCreateEventPayload) {
    return this.adminJson<AdminEvent>(`${ADMIN_BASE_URL}/admin/events`, {
      method: "POST",
      body: payload,
    });
  }

  async updateAdminEvent(eventId: string, payload: Partial<AdminCreateEventPayload>) {
    return this.adminJson<AdminEvent>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      body: payload,
    });
  }

  async getAdminEvents() {
    return this.adminJson<AdminEvent[]>(`${ADMIN_BASE_URL}/admin/events`, {
      method: "GET",
      });
  }

  async getAdminEventById(eventId: string) {
    return this.adminJson<AdminEvent>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}`, {
      method: "GET",
      });
  }

  async deactivateAdminEvent(eventId: string) {
    return this.adminJson<void>(
      `${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/deactivate`,
      {
        method: "POST",
        },
    );
  }

  async deleteAdminEvent(eventId: string) {
    return this.adminJson<{ success: boolean }>(
      `${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        },
    );
  }

  async exportAdminVisitors(eventId?: string) {
    const eventQuery = eventId ? `?eventId=${eventId}` : '';
    return this.adminDownload(`${ADMIN_BASE_URL}/admin/visitors/export${eventQuery}`);
  }

  async exportAdminVolunteers() {
    return this.adminDownload(`${ADMIN_BASE_URL}/admin/volunteers/export`);
  }

  async exportAdminEntries(eventId?: string) {
    const eventQuery = eventId ? `?eventId=${eventId}` : '';
    return this.adminDownload(`${ADMIN_BASE_URL}/admin/entries/export${eventQuery}`);
  }

  async exportAdminTickets(eventId?: string) {
    const eventQuery = eventId ? `?eventId=${eventId}` : '';
    return this.adminDownload(`${ADMIN_BASE_URL}/admin/tickets/export${eventQuery}`);
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
    return this.adminJson<EventSession[]>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions${query}`, {
      method: "GET",
      });
  }

  async getPresignedUploadUrl(fileName: string, fileType: string) {
    return this.adminJson<{ uploadUrl: string, imageUrl: string }>(`${ADMIN_BASE_URL}/admin/sessions/presigned-url`, {
      method: "POST",
      body: { fileName, fileType },
    });
  }

  async createAdminSession(eventId: string, payload: CreateSessionDto) {
    return this.adminJson<EventSession[]>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions`, {
      method: "POST",
      body: payload,
    });
  }

  async syncAdminSessions(eventId: string, payload: SyncSessionDto) {
    return this.adminJson<EventSession[]>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/sync`, {
      method: "PUT",
      body: payload,
    });
  }

  async updateAdminSession(eventId: string, sessionId: string, payload: UpdateSessionPayload) {
    return this.adminJson<EventSession>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      body: payload,
    });
  }

  async deleteAdminSession(eventId: string, sessionId: string) {
    return this.adminJson<{ success: boolean }>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      });
  }

  async bulkDeleteAdminSessions(eventId: string, sessionIds: string[]) {
    return this.adminJson<{ count: number }>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/bulk-delete`, {
      method: "POST",
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

    return this.adminJson<{ success: boolean; importedCount: number; errors: string[] }>(`${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/sessions/import`, {
      method: "POST",
      body: { csvContent: text },
    });
  }

  // --- CATEGORIES ---

  async getAdminCategories(): Promise<{ id: string; name: string }[]> {
    return this.adminJson<{ id: string; name: string }[]>(`${ADMIN_BASE_URL}/admin/categories`, {
      method: "GET",
      });
  }

  async createAdminCategory(name: string): Promise<{ id: string; name: string }> {
    return this.adminJson<{ id: string; name: string }>(`${ADMIN_BASE_URL}/admin/categories`, {
      method: "POST",
      body: { name },
    });
  }

  logoutVisitor() {
    localStorage.removeItem(STORAGE_KEYS.visitorJwt);
  }

  logoutVolunteer() {
    localStorage.removeItem(STORAGE_KEYS.volunteerJwt);
    localStorage.removeItem(STORAGE_KEYS.volunteerRefreshToken);
  }

  logoutAdmin() {
    localStorage.removeItem(STORAGE_KEYS.adminJwt);
    localStorage.removeItem(STORAGE_KEYS.adminRefreshToken);
  }

  async getWhatsappSettings() {
    return this.adminJson<any>(`${ADMIN_BASE_URL}/admin/settings/whatsapp`, {
      method: "GET",
      });
  }

  async updateWhatsappSettings(payload: any) {
    return this.adminJson<any>(`${ADMIN_BASE_URL}/admin/settings/whatsapp`, {
      method: "PATCH",
      body: payload,
    });
  }

  async getSmsSettings() {
    return this.adminJson<any>(`${ADMIN_BASE_URL}/admin/settings/sms`, {
      method: "GET",
      });
  }

  async updateSmsSettings(payload: any) {
    return this.adminJson<any>(`${ADMIN_BASE_URL}/admin/settings/sms`, {
      method: "PATCH",
      body: payload,
    });
  }

  async getWhatsappEventConfigs() {
    return this.adminJson<WhatsappEventConfig[]>(`${ADMIN_BASE_URL}/admin/settings/whatsapp-events`, {
      method: "GET",
      });
  }

  async createWhatsappEventConfig(payload: CreateWhatsappEventConfigPayload) {
    return this.adminJson<WhatsappEventConfig>(`${ADMIN_BASE_URL}/admin/settings/whatsapp-events`, {
      method: "POST",
      body: payload,
    });
  }

  async updateWhatsappEventConfig(configId: string, payload: UpdateWhatsappEventConfigPayload) {
    return this.adminJson<WhatsappEventConfig>(`${ADMIN_BASE_URL}/admin/settings/whatsapp-events/${encodeURIComponent(configId)}`, {
      method: "PATCH",
      body: payload,
    });
  }

  async deleteWhatsappEventConfig(configId: string) {
    return this.adminJson<{ success: boolean }>(`${ADMIN_BASE_URL}/admin/settings/whatsapp-events/${encodeURIComponent(configId)}`, {
      method: "DELETE",
      });
  }

  async getPlatformSettings() {
    return this.adminJson<PlatformSettings>(`${ADMIN_BASE_URL}/admin/settings/event-base-url`, {
      method: "GET",
      });
  }

  async updatePlatformSettings(payload: UpdatePlatformSettingsPayload) {
    return this.adminJson<UpdatePlatformSettingsResult>(`${ADMIN_BASE_URL}/admin/settings/event-base-url`, {
      method: "PATCH",
      body: payload,
    });
  }
}

export const apiService = new ApiService();
