/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabase } from './supabaseClient';

interface ProfileInput {
  name?: string;
  companyName?: string;
  phone?: string;
  jobPosition?: string;
  accountType?: 'individual' | 'company';
}

export async function signUpWithProfile(email: string, password: string, profile: ProfileInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: profile.name,
        company_name: profile.companyName,
        phone: profile.phone,
        job_position: profile.jobPosition,
        account_type: profile.accountType,
      },
    },
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: profile.name,
      company_name: profile.companyName,
      phone: profile.phone,
      job_position: profile.jobPosition,
      account_type: profile.accountType,
    });
    if (profileError) throw profileError;
  }
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
