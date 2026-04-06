type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3001";
const VISITOR_BASE_URL = import.meta.env.VITE_VISITOR_BASE_URL || "http://localhost:3002";
const VOLUNTEER_BASE_URL = import.meta.env.VITE_VOLUNTEER_BASE_URL || "http://localhost:3004";
const ADMIN_BASE_URL = import.meta.env.VITE_ADMIN_BASE_URL || "http://localhost:3005";

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
    const message =
      isRecord(data) && typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status})`;
    throw { message, status: res.status } satisfies ApiError;
  }

  return data as TResponse;
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
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  isActive: boolean;
  createdAt: string;
  status: string;
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
  ticketNumber: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  visitorId: string;
  visitorName: string;
  ticketType: "parent" | "child" | string;
  status: "active" | "inactive" | string;
  issuedAt: string;
}

export interface AdminAnalytics {
  visitorsPerDay: Array<{
    date: string;
    totalVisitors: number;
  }>;
  eventAnalytics: Array<{
    eventId: string;
    eventName: string;
    visitors: number;
    totalTickets: number;
    totalEntries: number;
    childrenTickets: number;
    volunteerRegistrations: number;
  }>;
  volunteerRegistrations: number;
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

  async requestOtp(payload: OtpRequestPayload, eventSlug = 'doon-book-festivals-dehradun-2026-04-04') {
    return httpJson<{ success: boolean; message: string; data: any }>(`${AUTH_BASE_URL}/auth/otp/request`, {
      method: "POST",
      headers: { ...this.eventHeader(eventSlug) },
      body: payload,
    });
  }

  async verifyOtp(payload: OtpVerifyPayload, eventSlug = 'doon-book-festivals-dehradun-2026-04-04') {
    const res = await httpJson<OtpVerifyResponse>(
      `${AUTH_BASE_URL}/auth/otp/verify`,
      {
        method: "POST",
        headers: { ...this.eventHeader(eventSlug) },
        body: payload,
      },
    );
    if (res?.accessToken) {
      localStorage.setItem(STORAGE_KEYS.visitorJwt, res.accessToken);
    }
    return res;
  }

  async registerVisitor(payload: VisitorRegisterPayload, eventSlug = 'doon-book-festivals-dehradun-2026-04-04') {
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
          ...this.eventHeader(eventSlug)
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

  async getAdminDashboard() {
    return httpJson<AdminDashboardStats>(`${ADMIN_BASE_URL}/admin/dashboard`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminVisitors() {
    return httpJson<AdminVisitor[]>(`${ADMIN_BASE_URL}/admin/visitors`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminEntries() {
    return httpJson<AdminEntry[]>(`${ADMIN_BASE_URL}/admin/entries`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminTickets() {
    return httpJson<AdminTicket[]>(`${ADMIN_BASE_URL}/admin/tickets`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminAnalytics() {
    return httpJson<AdminAnalytics>(`${ADMIN_BASE_URL}/admin/analytics`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async getAdminVolunteers() {
    return httpJson<AdminVolunteer[]>(`${ADMIN_BASE_URL}/admin/volunteers`, {
      method: "GET",
      headers: this.adminHeaders(),
    });
  }

  async createAdminVolunteer(payload: AdminCreateVolunteerPayload) {
    return httpJson<{ id: number }>(`${ADMIN_BASE_URL}/admin/volunteers`, {
      method: "POST",
      headers: this.adminHeaders(),
      body: payload,
    });
  }

  async createAdminEvent(payload: AdminCreateEventPayload) {
    return httpJson<{ id: string }>(`${ADMIN_BASE_URL}/admin/events`, {
      method: "POST",
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

  async deactivateAdminEvent(eventId: string) {
    return httpJson<void>(
      `${ADMIN_BASE_URL}/admin/events/${encodeURIComponent(eventId)}/deactivate`,
      {
        method: "POST",
        headers: this.adminHeaders(),
      },
    );
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
}

export const apiService = new ApiService();
