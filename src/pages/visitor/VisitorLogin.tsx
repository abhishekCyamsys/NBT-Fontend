import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck, RefreshCw, Calendar, MapPin, Search } from "lucide-react";
import { apiService } from "../../services/api";
import { COUNTRY_CODES } from "../../utils/countryCodes";

function maskMobile(mobile: string) {
  if (mobile.length < 4) return mobile;
  return `${mobile.slice(0, 2)}XXXX${mobile.slice(-2)}`;
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
  const { eventId } = useParams();
  
  const [eventData, setEventData] = useState<{ id: string; eventName: string; location: string; startDate: string; endDate: string; description?: string; bannerUrl?: string; slug: string; } | null>(null);
  const [hasVisitorJwt] = useState(() => !!localStorage.getItem("visitor_jwt"));

  useEffect(() => {
    if (eventId) {
      localStorage.setItem("current_event_id", eventId);
      apiService.getPublicEventBySlug(eventId).then(setEventData).catch(console.error);
    }
  }, [eventId]);

  useEffect(() => {
    // Only redirect if they ALREADY have a token when landing on the login page
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

  const otpValue = useMemo(() => otp.join(""), [otp]);

  const requestOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const fullMobile = `${countryCode}${mobileNumber}`;
      const response = await apiService.requestOtp({
        mobileNumber: fullMobile,
        purpose: "visitor_registration",
      }, eventId);
      if(response.success) {
        setStep("otp");
        setResendTimer(30);
      } else {
        setError(response.message)
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
    registration.id || registration.registrationId || registration
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
      eventId
    );

    // Always store formatted mobile
    localStorage.setItem("visitor_mobile", formattedMobile);

    // Common logic
    storeVisitor(res.visitor);
    storeRegistration(res.registration);

    if (res.case === "new_visitor") {
      navigate("/visitor/signup");
    } else if (res.case === "existing_visitor_new_event") {
      navigate(
        eventId
          ? `/visitor/events/${eventId}?autoCreate=true`
          : "/visitor/events"
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
    setVerifying(false); // fixed
  }
};

  const handleOtpChange = (index: number, value: string) => {
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
    <div className="flex min-h-screen flex-col lg:flex-row bg-white">
      {/* Visual / Branding Side */}
      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#B30447] to-[#7a0230] p-8 lg:p-12 text-white">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          {eventData?.bannerUrl ? (
            <img src={eventData.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,100 M100,0 L0,100" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <div className="relative z-10 space-y-6 text-center max-w-lg mx-auto">
          <div className="mx-auto inline-flex items-center justify-center rounded-3xl bg-white/10 p-4 shadow-2xl backdrop-blur-md border border-white/20 transition hover:scale-105">
            <img src="/NBTlogo.png" alt="NBT Logo" className="h-16 lg:h-24 w-auto object-contain" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Welcome to NBT
          </h1>
          <p className="mx-auto text-base text-rose-100 sm:text-lg lg:text-xl">
            Discover a world of literature. Register for upcoming events, book digital tickets, and experience the joy of reading.
          </p>
          {eventData && (
            <div className="mt-8 text-left bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">{eventData.eventName}</h3>
              <div className="flex items-center gap-2 text-rose-100 text-xs sm:text-sm mb-1">
                <MapPin className="h-4 w-4 shrink-0" /> {eventData.location}
              </div>
              <div className="flex items-center gap-2 text-rose-100 text-xs sm:text-sm mb-4">
                <Calendar className="h-4 w-4 shrink-0" /> {new Date(eventData.startDate).toLocaleDateString()} - {new Date(eventData.endDate).toLocaleDateString()}
              </div>
              <p className="text-white/90 text-xs sm:text-sm mb-2 leading-relaxed line-clamp-3">
                {eventData.description || "Join us for an amazing event celebrating literature and culture."}
              </p>
            </div>
          ) }
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full flex-col justify-center px-4 py-10 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900">
              Get Started
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === "mobile" 
                ? "Enter your mobile number to securely log in or register."
                : "We sent a secure code to verify your identity."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-xl p-6 sm:p-8">
            {step === "mobile" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void requestOtp();
                }}
                className="space-y-6 animate-in slide-in-from-left-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative flex group items-center bg-gray-50 border-2 border-gray-200 rounded-xl focus-within:border-[#B30447] focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50 transition">
                    <div className="pl-3 pr-2 flex items-center border-r border-gray-200">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountrySelect(!showCountrySelect)}
                          className="flex items-center gap-1 text-gray-700 font-medium text-sm focus:outline-none"
                        >
                          {countryCode} <span className="text-xs">▼</span>
                        </button>
                        {showCountrySelect && (
                          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
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
                            <div className="max-h-60 overflow-y-auto w-full">
                              {COUNTRY_CODES.filter(c => 
                                c.country.toLowerCase().includes(searchCountry.toLowerCase()) || 
                                c.code.includes(searchCountry)
                              ).map(c => (
                                <button
                                  key={c.country+c.code}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(c.code);
                                    setShowCountrySelect(false);
                                    setSearchCountry("");
                                  }}
                                  className="w-fulltext-left flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 bg-white"
                                >
                                  <span className="text-gray-700">{c.country}</span>
                                  <span className="text-gray-500 font-medium">{c.code}</span>
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
                        setMobileNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 15),
                        )
                      }
                      inputMode="numeric"
                      className="block w-full bg-transparent py-3.5 px-4 font-semibold text-gray-900 focus:outline-none"
                      placeholder="98765 43210"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mobileNumber.length !== 10}
                  className="w-full rounded-xl bg-[#B30447] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-200 transition-all hover:bg-[#9a033c] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? "Sending OTP…" : "Continue with Mobile"}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    OTP sent to <span className="font-bold text-gray-900">+91 {maskMobile(mobileNumber)}</span>
                  </p>
                  <button
                    onClick={() => {
                      setStep("mobile");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="mt-1 text-xs font-semibold text-[#B30447] hover:underline"
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
                      maxLength={1}
                      className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 transition-all focus:border-[#B30447] focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-50"
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
                    disabled={
                      verifying || otpValue.length !== 6 || otp.some((x) => !x)
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B30447] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-200 transition-all hover:bg-[#9a033c] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 disabled:shadow-none"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    {verifying ? "Verifying…" : "Verify OTP"}
                  </button>

                  <button
                    onClick={() => void resend()}
                    disabled={resending || resendTimer > 0}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : "Resend OTP"}
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
