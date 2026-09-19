"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "hospital" | "donor" | "bank";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("hospital");
  const [email, setEmail] = useState("trauma.desk@aiims.edu");
  const [password, setPassword] = useState("emergency2026");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  // Check URL query param ?role=donor | bank | hospital on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryRole = params.get("role") as UserRole;
      if (queryRole && ["hospital", "donor", "bank"].includes(queryRole)) {
        setRole(queryRole);
        if (queryRole === "donor") {
          setEmail("rahul.verma@lifeline.org");
          setPassword("donorhero2026");
        } else if (queryRole === "bank") {
          setEmail("inventory@redcross.org");
          setPassword("bloodbank2026");
        } else {
          setEmail("trauma.desk@aiims.edu");
          setPassword("emergency2026");
        }
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Signup successful! Redirecting to dashboard…");
          setTimeout(() => {
            router.push(`/${role}`);
          }, 600);
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            setMessage("Account created! Please sign in with your credentials.");
            setIsSignUp(false);
          } else {
            setMessage("Signup successful! Redirecting to dashboard…");
            setTimeout(() => {
              router.push(`/${role}`);
            }, 600);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const targetRole = role || data.user?.user_metadata?.role || "hospital";
        if (data.user) {
          supabase.auth.updateUser({ data: { role: targetRole } }).catch(() => {});
        }
        localStorage.setItem("lifeline_selected_role", targetRole);
        setMessage(`Authenticated! Redirecting to ${targetRole} portal…`);
        setTimeout(() => {
          router.push(`/${targetRole}`);
        }, 500);
      }
    } catch (err: any) {
      setErrorText(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Fill & Login for Evaluators
  const handleQuickDemoLogin = (targetRole: UserRole) => {
    setRole(targetRole);
    if (targetRole === "hospital") {
      setEmail("trauma.desk@aiims.edu");
      setPassword("emergency2026");
    } else if (targetRole === "donor") {
      setEmail("rahul.verma@lifeline.org");
      setPassword("donorhero2026");
    } else {
      setEmail("inventory@redcross.org");
      setPassword("bloodbank2026");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorText("");
    setMessage("");
    try {
      localStorage.setItem("lifeline_selected_role", role);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/${role}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorText(err.message || "Google sign-in failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-ink relative flex items-center justify-center p-4 sm:p-6 md:p-10 selection:bg-blood/10 selection:text-ink font-body page-enter overflow-hidden">
      
      {/* ── BACKGROUND BIOLOGICAL VASCULAR FLOW & FLOATING RUBY DROPLETS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
        
        {/* Dynamic Vascular Curves SVG */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-40" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Arterial Flow Ribbon */}
          <path
            d="M-80 180 C 180 90, 420 420, 220 640 C 40 820, 320 860, 680 820 C 1040 780, 1200 890, 1500 750"
            stroke="url(#login-blood-grad-1)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Animated Laser Vein Signal */}
          <path
            d="M-80 180 C 180 90, 420 420, 220 640 C 40 820, 320 860, 680 820 C 1040 780, 1200 890, 1500 750"
            stroke="#FF3333"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="animate-laser-dash opacity-60"
          />
          {/* Secondary Arterial Ribbon */}
          <path
            d="M-40 90 C 260 70, 520 360, 360 590 C 210 790, 680 770, 940 840 C 1200 910, 1380 720, 1520 640"
            stroke="url(#login-blood-grad-2)"
            strokeWidth="1.5"
            strokeDasharray="6 10"
            fill="none"
          />
          <defs>
            <linearGradient id="login-blood-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A8201A" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#E11D48" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#A8201A" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="login-blood-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#A8201A" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* ── Realistic Floating 3D Ruby Blood Droplets ── */}
        
        {/* Droplet 1 (Top Left) */}
        <div className="absolute top-[8%] left-[6%] animate-float-sway select-none hidden sm:block">
          <svg width="40" height="54" viewBox="0 0 36 48" fill="none" className="filter drop-shadow-[0_8px_20px_rgba(168,32,26,0.35)]">
            <path
              d="M18 2 C18 2, 2 22, 2 32 C2 40.8366, 9.16344 48, 18 48 C26.8366 48, 34 40.8366, 34 32 C34 22, 18 2, 18 2Z"
              fill="url(#login-ruby-1)"
            />
            {/* Specular Glint */}
            <path
              d="M10 26 C10 26, 6 32, 6 36 C6 38, 8 40, 10 40 C8 38, 7 36, 7 34 C7 30, 10 26, 10 26Z"
              fill="white"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="login-ruby-1" x1="4" y1="2" x2="32" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="40%" stopColor="#A8201A" />
                <stop offset="100%" stopColor="#4A0503" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Droplet 2 (Bottom Left) */}
        <div className="absolute bottom-[10%] left-[8%] animate-float-sway-rev select-none hidden md:block">
          <svg width="32" height="42" viewBox="0 0 36 48" fill="none" className="filter drop-shadow-[0_6px_16px_rgba(168,32,26,0.3)]">
            <path
              d="M18 2 C18 2, 2 22, 2 32 C2 40.8366, 9.16344 48, 18 48 C26.8366 48, 34 40.8366, 34 32 C34 22, 18 2, 18 2Z"
              fill="url(#login-ruby-2)"
            />
            <path
              d="M10 26 C10 26, 6 32, 6 36 C6 38, 8 40, 10 40 C8 38, 7 36, 7 34 C7 30, 10 26, 10 26Z"
              fill="white"
              opacity="0.5"
            />
            <defs>
              <linearGradient id="login-ruby-2" x1="4" y1="2" x2="32" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="45%" stopColor="#A8201A" />
                <stop offset="100%" stopColor="#550805" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Droplet 3 (Top Right) */}
        <div className="absolute top-[10%] right-[7%] animate-float-sway-rev select-none hidden sm:block">
          <svg width="36" height="48" viewBox="0 0 36 48" fill="none" className="filter drop-shadow-[0_8px_18px_rgba(168,32,26,0.35)]">
            <path
              d="M18 2 C18 2, 2 22, 2 32 C2 40.8366, 9.16344 48, 18 48 C26.8366 48, 34 40.8366, 34 32 C34 22, 18 2, 18 2Z"
              fill="url(#login-ruby-3)"
            />
            <path
              d="M10 26 C10 26, 6 32, 6 36 C6 38, 8 40, 10 40 C8 38, 7 36, 7 34 C7 30, 10 26, 10 26Z"
              fill="white"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="login-ruby-3" x1="4" y1="2" x2="32" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="40%" stopColor="#A8201A" />
                <stop offset="100%" stopColor="#4A0503" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Droplet 4 (Bottom Right) */}
        <div className="absolute bottom-[8%] right-[8%] animate-float-sway select-none hidden md:block">
          <svg width="44" height="58" viewBox="0 0 36 48" fill="none" className="filter drop-shadow-[0_10px_24px_rgba(168,32,26,0.35)]">
            <path
              d="M18 2 C18 2, 2 22, 2 32 C2 40.8366, 9.16344 48, 18 48 C26.8366 48, 34 40.8366, 34 32 C34 22, 18 2, 18 2Z"
              fill="url(#login-ruby-4)"
            />
            <path
              d="M10 26 C10 26, 6 32, 6 36 C6 38, 8 40, 10 40 C8 38, 7 36, 7 34 C7 30, 10 26, 10 26Z"
              fill="white"
              opacity="0.5"
            />
            <defs>
              <linearGradient id="login-ruby-4" x1="4" y1="2" x2="32" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="45%" stopColor="#A8201A" />
                <stop offset="100%" stopColor="#550805" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Ambient Warm Radial Crimson Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Centered Main Portal Card ── */}
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-ink-10 shadow-[0_12px_40px_rgba(28,25,23,0.08)] overflow-hidden grid md:grid-cols-12 relative z-10">
        
        {/* ── Left Editorial / Branding Column (5 cols) ── */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1C1917] via-[#140F0F] to-[#250907] text-white p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="#A8201A" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="25" stroke="#A8201A" strokeWidth="0.5" />
            </svg>
          </div>

          <div>
            {/* Top Badge */}
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-red-400">
              <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
              LifeLine Bio-Secure
            </div>

            {/* Title */}
            <h2 className="mt-6 font-display text-2xl sm:text-3xl font-semibold leading-tight text-white">
              Every <span className="italic font-normal text-red-400">second</span> counts in the supply chain.
            </h2>
            <p className="mt-3 text-xs text-white/70 leading-relaxed">
              Authorized access for hospital emergency desks, voluntary donor dispatch, and blood bank reserve tracking.
            </p>
          </div>

          {/* Quick 1-Click Demo Roles for Evaluators */}
          <div className="my-6 pt-5 border-t border-white/10 space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-300 font-bold block">
              ⚡ Evaluator 1-Click Fill:
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("hospital")}
                className={`py-1.5 px-2 rounded-lg text-center transition border ${
                  role === "hospital"
                    ? "bg-blood text-white border-blood"
                    : "bg-white/10 hover:bg-white/20 text-white/80 border-white/10"
                }`}
              >
                🏥 Hospital
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("donor")}
                className={`py-1.5 px-2 rounded-lg text-center transition border ${
                  role === "donor"
                    ? "bg-blood text-white border-blood"
                    : "bg-white/10 hover:bg-white/20 text-white/80 border-white/10"
                }`}
              >
                🙋 Donor
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("bank")}
                className={`py-1.5 px-2 rounded-lg text-center transition border ${
                  role === "bank"
                    ? "bg-blood text-white border-blood"
                    : "bg-white/10 hover:bg-white/20 text-white/80 border-white/10"
                }`}
              >
                🏢 Bank
              </button>
            </div>
          </div>

          {/* Bottom Security Pill */}
          <div className="flex items-center justify-between text-xs font-mono text-white/40 pt-2">
            <span>SECURE JWT AUTH</span>
            <span className="text-emerald-400 font-semibold">● ONLINE</span>
          </div>
        </div>

        {/* ── Right Form Column (7 cols) ── */}
        <div className="md:col-span-7 p-7 sm:p-9 flex flex-col justify-between bg-white">
          <div>
            {/* Form Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">
                  {isSignUp ? "Create LifeLine Account" : "Portal Sign In"}
                </h1>
                <p className="mt-0.5 text-xs text-ink-60 font-body">
                  Select your role and authenticate to access your dashboard.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ink-5 hover:bg-ink-10 text-ink font-mono text-xs font-bold transition-all border border-ink-10 shadow-sm hover:border-ink/40"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-ink-5 rounded-2xl mb-5 border border-ink-10 text-xs font-mono">
              {(["hospital", "donor", "bank"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-xl font-semibold capitalize transition-all ${
                    role === r
                      ? "bg-white text-ink shadow-sm border border-ink-10/60 font-bold"
                      : "text-ink-60 hover:text-ink"
                  }`}
                >
                  {r === "hospital" ? "🏥 Hospital" : r === "donor" ? "🙋 Donor" : "🏢 Bank"}
                </button>
              ))}
            </div>

            {/* Status Messages */}
            {message && (
              <div className="mb-4 p-3 rounded-xl border border-green-200 bg-green-50 font-mono text-xs text-green-800 animate-fade-in">
                {message}
              </div>
            )}

            {errorText && (
              <div className="mb-4 p-3 rounded-xl border border-blood/20 bg-blood-50 font-mono text-xs text-blood animate-fade-in">
                {errorText}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-3.5">
              <div>
                <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trauma.desk@aiims.edu"
                  className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition placeholder:text-ink-40 focus:border-blood/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition placeholder:text-ink-40 focus:border-blood/40 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blood py-3 font-display text-sm font-semibold text-white transition hover:bg-blood-light disabled:opacity-50 shadow-sm mt-2"
              >
                {loading ? "Authenticating…" : isSignUp ? "Create Account →" : `Sign In to ${role.toUpperCase()} Portal →`}
              </button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-ink-10" />
              <span className="font-mono text-xs uppercase tracking-widest text-ink-60">or continue with</span>
              <div className="flex-1 h-px bg-ink-10" />
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-ink-10 bg-white py-2.5 font-mono text-xs font-semibold text-ink transition hover:bg-ink-5 shadow-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Workspace SSO
            </button>
          </div>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-5 pt-3 border-t border-ink-10 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorText("");
                setMessage("");
              }}
              className="font-mono text-xs uppercase tracking-wider text-blood hover:underline font-semibold"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
