import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Check,
} from "lucide-react";
import logoImg from "../../assets/Parivartan_Logo.png";
import { BASE_URL } from "../../constants/config";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);  
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Simple validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid = emailRegex.test(email) && password.length >= 6;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        toast.success("Login successful!");
        onLogin(data);
      } else {
        const errorMsg = data.message || "Invalid Email or Password";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch {
      toast.error("Server error. Please try again.");
      setError("Server error. Please try again.");
    }

    setIsLoading(false);
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-slate-900/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md md:max-w-[420px] lg:max-w-md mx-auto animate-fade-in relative z-10 flex flex-col items-center justify-center h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-4 mb-4 md:mb-6">
          {!imgError ? (
            <img
              src={logoImg}
              alt="Logo"
              className="w-40 md:w-56 lg:w-72 h-auto object-contain drop-shadow-2xl transition-all duration-500 hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-14 h-14 md:w-18 md:h-18 lg:w-22 lg:h-22 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
              <Leaf
                size={32}
                className="md:w-10 md:h-10 lg:w-14 lg:h-14"
                fill="currentColor"
              />
            </div>
          )}

        </div>

        {/* Login Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 w-full transition-all duration-500">
          <div className="mb-6 pb-6 border-b border-slate-100">
            <h2 className="text-xl md:text-2xl font-bold text-[#18254D]">
              CRM Login 
            </h2>
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1">
              Please sign in to your account
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                Email ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@parivartan.crm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. ••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#18254D] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center transition-all ${rememberMe ? 'bg-[#18254D] border-[#18254D]' : 'bg-white border-2 border-slate-300 group-hover:border-[#18254D]'}`}>
                    {rememberMe && <Check size={12} className="text-white" strokeWidth={4} />}
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 group-hover:text-[#18254D] transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-error/5 border border-error/10 rounded-xl flex items-center gap-3 text-error animate-fade-in mt-2">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-semibold leading-tight">
                  {error}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm active:scale-[0.98] ${
                  isFormValid && !isLoading
                    ? "bg-[#18254D] text-white hover:bg-[#2B3B60]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-10 md:mb-2 text-[12px] lg:text-xs font-bold text-slate-400  tracking-widest opacity-60">
          2026 © eParivartan - CRM
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
