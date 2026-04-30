import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShieldCheck,
  RefreshCw,
  Calendar,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiService } from "../../services/api";
import { visitorDailyCreatives } from "../../data/visitorDailyCreatives";
import { COUNTRY_CODES } from "../../utils/countryCodes";

const CREATIVE_TIMEZONE = "Asia/Kolkata";

function getDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CREATIVE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getActiveCreative(dateKey: string) {
  const sortedCreatives = [...visitorDailyCreatives].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const exactMatch = sortedCreatives.find((creative) => creative.date === dateKey);
  if (exactMatch) return exactMatch;

  const previousCreative = [...sortedCreatives]
    .reverse()
    .find((creative) => creative.date <= dateKey);

  return previousCreative ?? sortedCreatives[0] ?? null;
}

export default function VisitorLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [activeCreativeIndex, setActiveCreativeIndex] = useState(0);
  const [isCreativePreviewOpen, setIsCreativePreviewOpen] = useState(false);
  const { eventId } = useParams();

  const [eventData, setEventData] = useState<{
    id: string;
    eventName: string;
    location: string;
    startDate: string;
    endDate: string;
    description?: string;
    bannerUrl?: string;
    slug: string;
  } | null>(null);
  const [hasVisitorJwt] = useState(() => !!localStorage.getItem("visitor_jwt"));

  const todayKey = useMemo(() => getDateKey(new Date()), []);
  const activeCreative = useMemo(() => getActiveCreative(todayKey), [todayKey]);
  const creativeImages = activeCreative?.images ?? [];
  const activeCreativeImage = activeCreative?.images[activeCreativeIndex] ?? null;

  useEffect(() => {
    if (eventId) {
      localStorage.setItem("current_event_id", eventId);
      apiService.getPublicEventBySlug(eventId).then(setEventData).catch(console.error);
    }
  }, [eventId]);

  useEffect(() => {
    if (hasVisitorJwt) {
      navigate("/visitor/tickets");
    }
  }, [hasVisitorJwt, navigate]);

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    setActiveCreativeIndex(0);
  }, [activeCreative?.date]);

  useEffect(() => {
    if (creativeImages.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveCreativeIndex((current) => (current + 1) % creativeImages.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [creativeImages.length]);

  const otpValue = useMemo(() => otp.join(""), [otp]);

  const goToPreviousCreativeImage = () => {
    if (creativeImages.length <= 1) return;

    setActiveCreativeIndex((current) =>
      current === 0 ? creativeImages.length - 1 : current - 1,
    );
  };

  const goToNextCreativeImage = () => {
    if (creativeImages.length <= 1) return;

    setActiveCreativeIndex((current) => (current + 1) % creativeImages.length);
  };

  useEffect(() => {
    if (!isCreativePreviewOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreativePreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isCreativePreviewOpen]);

  const requestOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const fullMobile = `${countryCode}${mobileNumber}`;
      const response = await apiService.requestOtp(
        {
          mobileNumber: fullMobile,
          purpose: "visitor_registration",
        },
        eventId,
      );
      if (response.success) {
        setStep("otp");
        setResendTimer(30);
      } else {
        setError(response.message);
      }
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const storeVisitor = (visitor: any) => {
    if (!visitor) return;

    const mobile = visitor.mobileNumber
      ? visitor.mobileNumber.startsWith("+")
        ? visitor.mobileNumber
        : `+${visitor.mobileNumber}`
      : "";

    localStorage.setItem("visitor_name", visitor.name || "");
    localStorage.setItem("visitor_mobile", mobile);

    if (visitor.age) localStorage.setItem("visitor_age", visitor.age);
    if (visitor.gender) localStorage.setItem("visitor_gender", visitor.gender);
    if (visitor.city) localStorage.setItem("visitor_city", visitor.city);
    if (visitor.email) localStorage.setItem("visitor_email", visitor.email);
  };

  const storeRegistration = (registration: any) => {
    if (!registration) return;

    localStorage.setItem(
      "visitor_last_registration_id",
      registration.id || registration.registrationId || registration,
    );
  };

  const verifyOtp = async () => {
    setError("");
    setVerifying(true);

    try {
      const fullMobile = `${countryCode}${mobileNumber}`;
      const formattedMobile = fullMobile.startsWith("+")
        ? fullMobile
        : `+${fullMobile}`;

      const res = await apiService.verifyOtp(
        { mobileNumber: formattedMobile, otp: otpValue },
        eventId,
      );

      localStorage.setItem("visitor_mobile", formattedMobile);

      storeVisitor(res.visitor);
      storeRegistration(res.registration);

      if (res.case === "new_visitor") {
        navigate("/visitor/signup");
      } else if (res.case === "existing_visitor_new_event") {
        navigate(
          eventId
            ? `/visitor/events/${eventId}?autoCreate=true`
            : "/visitor/events",
        );
      } else if (res.case === "already_registered") {
        navigate("/visitor/tickets");
      } else {
        navigate(eventId ? `/visitor/events/${eventId}` : "/visitor/events");
      }
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message)
          : "OTP verification failed";

      setError(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length >= 6) {
      const otpDigits = digits.length > 6 ? digits.slice(-6) : digits;
      const next = [...otp];
      otpDigits.split("").forEach((c, i) => {
        if (i < 6) next[i] = c;
      });
      setOtp(next);
      setError("");
      inputRefs.current[5]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const next = [...otp];
    pasted.split("").forEach((c, i) => {
      if (i < 6) next[i] = c;
    });
    setOtp(next);
    const nextEmpty = next.findIndex((v) => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const resend = async () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    await requestOtp();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f4ef] lg:flex-row">
      <div className="relative flex w-full lg:w-1/2 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_32%),linear-gradient(145deg,_#b60f50_0%,_#7e0d3e_48%,_#35122b_100%)] p-6 text-white sm:p-8 lg:p-10 xl:p-12">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          {eventData?.bannerUrl ? (
            <img src={eventData.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,100 M100,0 L0,100" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,8,12,0.05)_0%,rgba(12,8,12,0.36)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_47%,rgba(255,255,255,0.06)_47%,rgba(255,255,255,0.06)_50%,transparent_50%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,transparent_18%,rgba(255,255,255,0.04)_18%,rgba(255,255,255,0.04)_21%,transparent_21%,transparent_100%)]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-between gap-6 lg:gap-10">
          <div className="flex items-start justify-center lg:justify-start">
            <div className="inline-flex rounded-[20px] lg:rounded-[26px] bg-white/12 p-3 lg:p-4 shadow-[0_22px_55px_rgba(34,8,21,0.24)] ring-1 ring-white/10 backdrop-blur-md transition-transform hover:scale-105">
              <img src="/NBTlogo.png" alt="NBT Logo" className="h-14 w-auto object-contain sm:h-16 lg:h-24" />
            </div>
          </div>

          <div className="flex items-end justify-center lg:justify-end">
            <div className="w-full max-w-[500px] rounded-[24px] lg:rounded-[34px] border border-white/10 bg-white/5 p-3 lg:p-4 shadow-[0_30px_90px_rgba(18,6,13,0.32)] backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="rounded-[20px] lg:rounded-[28px] bg-[#fdf4ef] p-4 text-[#311523] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5">
                 <h2 className="font-display text-xl font-bold sm:text-2xl text-center mb-2">
                      {activeCreative?.title ?? "Welcome to NBT"}
                    </h2>
			  

                <div className="relative overflow-hidden rounded-[16px] bg-gray-50 shadow-[0_14px_35px_rgba(54,20,34,0.14)] lg:rounded-[24px]">
                  {activeCreativeImage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsCreativePreviewOpen(true)}
                        aria-label="Open creative image preview"
                        className="block w-full"
                      >
                        <img
                          src={activeCreativeImage}
                          alt={`${activeCreative?.title ?? "NBT creative"} for ${activeCreative?.date ?? todayKey}`}
                          className="aspect-[4/3] w-full object-contain p-2 sm:aspect-square lg:h-[480px] lg:aspect-auto lg:p-0"
                        />
                      </button>

                      {creativeImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              goToPreviousCreativeImage();
                            }}
                            aria-label="Show previous creative image"
                            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#311523]/70 text-white backdrop-blur-sm transition hover:bg-[#311523]/85"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              goToNextCreativeImage();
                            }}
                            aria-label="Show next creative image"
                            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#311523]/70 text-white backdrop-blur-sm transition hover:bg-[#311523]/85"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>

                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#fce7ef] px-6 text-center text-sm font-medium text-[#9f174d] sm:aspect-square lg:aspect-auto lg:h-[480px]">
                      Creative will appear here when scheduled.
                    </div>
                  )}
                </div>

                {eventData && (
                  <div className="mt-4 rounded-[22px] bg-[#f8e7ee] p-4 text-left">
                    <h3 className="font-display text-lg font-bold text-[#4a1830]">{eventData.eventName}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#8b355e] sm:text-sm">
                      <MapPin className="h-4 w-4 shrink-0" /> {eventData.location}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#8b355e] sm:text-sm">
                      <Calendar className="h-4 w-4 shrink-0" /> {new Date(eventData.startDate).toLocaleDateString()} - {new Date(eventData.endDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

               
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCreativePreviewOpen && activeCreativeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0a13]/85 p-4 backdrop-blur-sm"
          onClick={() => setIsCreativePreviewOpen(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_30px_100px_rgba(18,6,13,0.5)] sm:p-4"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Creative image preview"
          >
            <button
              type="button"
              onClick={() => setIsCreativePreviewOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-[#311523]/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#311523]"
            >
              Close
            </button>
            <img
              src={activeCreativeImage}
              alt={`${activeCreative?.title ?? "NBT creative"} full preview`}
              className="max-h-[85vh] w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md lg:max-w-lg">
          <div className="mb-8 lg:mb-10 space-y-4 lg:space-y-5">
          
            <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900">
              Get your free pass
            </h2>
            <p className="text-sm text-gray-600">
              {step === "mobile"
                ? "Enter your mobile number to securely log in or register."
                : "We sent a secure code to verify your identity."}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_18px_50px_rgba(48,24,37,0.12)] sm:p-8">
            {step === "mobile" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void requestOtp();
                }}
                className="animate-in space-y-6 slide-in-from-left-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Mobile Number
                  </label>
                  <div className="group relative flex items-center rounded-xl border-2 border-gray-200 bg-gray-50 transition focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                    <div className="flex items-center border-r border-gray-200 pl-3 pr-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountrySelect(!showCountrySelect)}
                          className="flex items-center gap-1 text-sm font-medium text-gray-700 focus:outline-none"
                        >
                          {countryCode} <span className="text-xs">v</span>
                        </button>
                        {showCountrySelect && (
                          <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                            <div className="flex items-center gap-2 border-b border-gray-100 p-2">
                              <Search className="h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                autoFocus
                                value={searchCountry}
                                onChange={(e) => setSearchCountry(e.target.value)}
                                placeholder="Search country..."
                                className="w-full text-sm outline-none"
                              />
                            </div>
                            <div className="max-h-60 w-full overflow-y-auto">
                              {COUNTRY_CODES.filter(
                                (c) =>
                                  c.country.toLowerCase().includes(searchCountry.toLowerCase()) ||
                                  c.code.includes(searchCountry),
                              ).map((c) => (
                                <button
                                  key={c.country + c.code}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(c.code);
                                    setShowCountrySelect(false);
                                    setSearchCountry("");
                                  }}
                                  className="flex w-full items-center justify-between bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  <span className="text-gray-700">{c.country}</span>
                                  <span className="font-medium text-gray-500">{c.code}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 15))
                      }
                      inputMode="numeric"
                      className="block w-full bg-transparent px-4 py-3.5 font-semibold text-gray-900 focus:outline-none"
                      placeholder="98765 43210"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="animate-in rounded-xl border border-red-200 bg-red-50 p-4 fade-in slide-in-from-top-2">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mobileNumber.length !== 10}
                  className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-200 transition-all hover:bg-primary-dark hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? "Sending OTP..." : "Continue with Mobile"}
                </button>
              </form>
            ) : (
              <div className="animate-in space-y-6 slide-in-from-right-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    OTP sent to <span className="font-bold text-gray-900">{countryCode} {mobileNumber}</span>
                  </p>
                  <button
                    onClick={() => {
                      setStep("mobile");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="mt-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                <div className="flex justify-between gap-2">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="h-12 w-10 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 sm:h-14 sm:w-12"
                      disabled={verifying || resending}
                    />
                  ))}
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => void verifyOtp()}
                    disabled={verifying || otpValue.length !== 6 || otp.some((x) => !x)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-200 transition-all hover:bg-primary-dark hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:shadow-none"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    {verifying ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    onClick={() => void resend()}
                    disabled={resending || resendTimer > 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            By proceeding, you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
