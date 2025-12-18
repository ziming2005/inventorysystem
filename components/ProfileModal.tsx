/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export interface UserProfile {
  email?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  job_position?: string | null;
  account_type?: string | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  userEmail?: string | null;
  onSignOut: () => void;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
    <div className="text-sm text-slate-800 text-right break-all">{value || '—'}</div>
  </div>
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, userEmail, onSignOut }) => {
  if (!isOpen) return null;

  const displayEmail = profile?.email || userEmail || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Profile</div>
              <div className="text-xs text-slate-600 truncate max-w-[250px]">{displayEmail || 'Signed in'}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors" aria-label="Close profile modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          <Field label="Email" value={displayEmail} />
          <div className="h-px bg-slate-200 my-2" />
          <Field label="Name" value={profile?.full_name || null} />
          <Field label="Account Type" value={profile?.account_type || null} />
          <Field label="Company" value={profile?.company_name || null} />
          <Field label="Phone" value={profile?.phone || null} />
          <Field label="Job Position" value={profile?.job_position || null} />
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

