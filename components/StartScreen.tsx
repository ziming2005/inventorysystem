
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { signInWithEmail, signUpWithProfile } from '../services/authService';

interface StartScreenProps {
  onAuthenticated: () => void;
}

type ViewMode = 'login' | 'signup';
type AccountType = 'individual' | 'company';

const StartScreen: React.FC<StartScreenProps> = ({ onAuthenticated }) => {
  const [view, setView] = useState<ViewMode>('signup');
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State (Visual only for prototype)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    phone: '',
    jobPosition: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (view === 'signup' && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'signup') {
        await signUpWithProfile(formData.email, formData.password, {
          name: formData.name,
          companyName: formData.companyName,
          phone: formData.phone,
          jobPosition: formData.jobPosition,
          accountType,
        });
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
      onAuthenticated();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fade-in relative">
          
          {/* --- SIGNUP VIEW --- */}
          {view === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Account Type Toggle */}
              <div className="flex flex-col items-center mb-6">
                <h2 className="text-lg font-medium text-slate-700 mb-3">Account Type</h2>
                <div className="flex w-full rounded-lg border border-blue-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAccountType('individual')}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                      accountType === 'individual' 
                        ? 'bg-[#0047AB] text-white' 
                        : 'bg-white text-[#0047AB] hover:bg-slate-50'
                    }`}
                    disabled={isSubmitting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('company')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                      accountType === 'company' 
                        ? 'bg-[#0047AB] text-white' 
                        : 'bg-white text-[#0047AB] hover:bg-slate-50'
                    }`}
                    disabled={isSubmitting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    Company
                  </button>
                </div>
              </div>

              {/* COMPANY SPECIFIC FIELDS */}
              {accountType === 'company' && (
                <>
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-1">Company Name</label>
                    <input 
                      type="text" 
                      name="companyName"
                      placeholder="e.g. INTERCOM MALI" 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-1">Company Email</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="e.g. hello@intercom.ml" 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      onChange={handleInputChange}
                    />
                    <p className="text-slate-500 text-xs mt-1">Company email for login and communication</p>
                  </div>
                </>
              )}

              {/* COMMON FIELDS */}
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">
                  {accountType === 'company' ? 'Name' : 'Your Name'}
                </label>
                <input 
                  type="text" 
                  name="name"
                  placeholder={accountType === 'company' ? 'Name' : 'e.g. Nour AYACHE'} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  onChange={handleInputChange}
                />
              </div>

              {/* Individual Email Field (Only if not company, as company has specific email field above) */}
              {accountType === 'individual' && (
                 <div>
                    <label className="block text-slate-700 text-sm font-medium mb-1">Your Email</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="e.g. nourayach@gmail.com" 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      onChange={handleInputChange}
                    />
                    <p className="text-slate-500 text-xs mt-1">This will be your login email</p>
                 </div>
              )}

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">
                  {accountType === 'company' ? 'Phone' : 'Phone (WhatsApp)'}
                </label>
                <input 
                  type="tel" 
                  name="phone"
                  placeholder={accountType === 'company' ? 'Phone' : 'e.g. +1234567890'}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Job Position</label>
                <select 
                  name="jobPosition"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  required
                  onChange={handleInputChange}
                  defaultValue=""
                >
                  <option value="" disabled>-- Select Position --</option>
                  <option value="Dentist">Dentist</option>
                  <option value="Clinic Manager">Clinic Manager</option>
                  <option value="Architect">Architect</option>
                  <option value="Equipment Supplier">Equipment Supplier</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Password</label>
                <input 
                  type="password"
                  name="password"
                  placeholder={accountType === 'company' ? '' : ''}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Confirm Password</label>
                <input 
                  type="password"
                  name="confirmPassword"
                  placeholder="" 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  onChange={handleInputChange}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0047AB] hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all mt-4"
              >
                {isSubmitting ? 'Creating account...' : 'Sign up'}
              </button>

              <div className="text-center mt-4">
                <span className="text-[#0047AB] text-sm font-medium cursor-pointer hover:underline" onClick={() => { setView('login'); setErrorMessage(null); }}>
                  Already have an account?
                </span>
              </div>

              {errorMessage && (
                <p className="text-center text-sm text-red-600 mt-3">{errorMessage}</p>
              )}
            </form>
          )}

          {/* --- LOGIN VIEW --- */}
          {view === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              
              <div>
                <label className="block text-slate-800 text-lg font-medium mb-2">Email</label>
                <div className="relative">
                    {/* Visual cue for focus or just styling wrapper */}
                    <input 
                    type="email" 
                    name="email"
                    placeholder="Email" 
                    className="w-full border-2 border-slate-200/80 rounded-lg px-4 py-3 text-base text-slate-600 focus:ring-0 focus:border-blue-400 outline-none transition-all"
                    style={{boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)'}} // mimicking the focus ring in image 3
                    required
                    onChange={handleInputChange}
                    />
                     {/* The screenshot shows a blinking cursor bar style input, standard input is fine */}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-800 text-lg font-medium">Password</label>
                    <button
                      type="button"
                      className="text-[#0047AB] text-sm font-medium hover:underline"
                      onClick={(e) => { e.preventDefault(); /* TODO: implement reset flow without navigation */ }}
                    >
                      Reset Password
                    </button>
                </div>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  onChange={handleInputChange}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0047AB] hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-lg"
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>

              <div className="text-center mt-6">
                <span className="text-[#0047AB] text-sm font-medium cursor-pointer hover:underline" onClick={() => { setView('signup'); setErrorMessage(null); }}>
                  Don't have an account?
                </span>
              </div>

              {errorMessage && (
                <p className="text-center text-sm text-red-600 mt-3">{errorMessage}</p>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default StartScreen;
