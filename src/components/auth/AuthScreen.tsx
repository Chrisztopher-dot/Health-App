import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  UserPlus,
  LogIn
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { AuthSession } from '../../types/auth';

interface AuthScreenProps {
  onAuthenticated: (session: AuthSession) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState<string>('eleonor');
  const [loginPassword, setLoginPassword] = useState<string>('health2026');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regAge, setRegAge] = useState<number>(75);
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [targetSys, setTargetSys] = useState<number>(130);
  const [targetDia, setTargetDia] = useState<number>(85);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Seed default demo user on mount
  useEffect(() => {
    AuthService.initDefaultDemoUserIfEmpty();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await AuthService.login({
        username: loginUsername,
        password: loginPassword,
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onAuthenticated(res.session);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('Logging in with Senior Demo Account...');
    setIsLoading(true);

    try {
      const session = await AuthService.loginWithDemoAccount();
      setTimeout(() => {
        onAuthenticated(session);
      }, 300);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await AuthService.register({
        displayName: regName.trim() || regUsername.trim(),
        username: regUsername.trim(),
        password: regPassword,
        age: regAge || 75,
        targetSystolicMax: targetSys || 130,
        targetDiastolicMax: targetDia || 85,
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        onAuthenticated(res.session);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please try a different username.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-screen-dynamic bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex flex-col justify-center items-center p-3 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Auth Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border-2 border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-950/50 mb-1">
            <Heart className="w-8 h-8 fill-white/20 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>CarePulse Health</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Senior 2.0
            </span>
          </h1>
          <p className="text-sm font-semibold text-slate-400 max-w-sm mx-auto">
            Your private daily health check-in, medication adherence & vitals companion
          </p>
        </div>

        {/* Security / Cryptographic Salting & Hashing Badge */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-extrabold text-emerald-300">
              Bank-Grade Security with PBKDF2 Salting & Hashing
            </p>
            <p className="text-slate-400 leading-relaxed font-medium">
              Passwords are protected with random cryptographic salts and 100,000 PBKDF2-SHA256 rounds. No plaintext passwords are ever saved.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (Sign In vs Create Account) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs font-bold text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Mode 1: Sign In */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Username or Email
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. eleonor"
                className="w-full px-4 py-3 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Password
                </label>
                <span className="text-[11px] text-emerald-400 font-bold">Salted & Hashed</span>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none transition-all placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 text-base"
            >
              {isLoading ? (
                <span>Verifying Salt & Hash...</span>
              ) : (
                <>
                  <span>Sign In to Your Health Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick 1-Click Demo Login */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-black text-emerald-300 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Quick 1-Click Senior Demo Login (Eleonor Vance)</span>
              </button>
            </div>
          </form>
        )}

        {/* Form Mode 2: Create Account */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Eleonor Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. eleonor78"
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                Age
              </label>
              <input
                type="number"
                min="18"
                max="120"
                value={regAge}
                onChange={(e) => setRegAge(Number(e.target.value) || 75)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 4 chars"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Confirm Password
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-semibold text-sm outline-none"
                />
              </div>
            </div>

            {/* Target Blood Pressure defaults */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>Target Blood Pressure Baseline (mmHg)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400">Systolic Max</span>
                  <input
                    type="number"
                    value={targetSys}
                    onChange={(e) => setTargetSys(Number(e.target.value) || 130)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Diastolic Max</span>
                  <input
                    type="number"
                    value={targetDia}
                    onChange={(e) => setTargetDia(Number(e.target.value) || 85)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 text-base mt-2"
            >
              {isLoading ? (
                <span>Deriving Salt & PBKDF2 Hash...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Create Salted & Hashed Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 font-medium">
          Encrypted client-side with AES-256 GCM • HIPAA Architecture Compliant
        </div>
      </div>
    </div>
  );
};
