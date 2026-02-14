'use client';

import { useEffect, useState } from 'react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/owner/profile');
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setFullName(json.data.full_name || '');
          setAvatarUrl(json.data.avatar_url || '');
        }
      } catch {
        console.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setMessage('');

    if (newPassword && newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        full_name: fullName,
        avatar_url: avatarUrl,
      };
      if (newPassword) {
        body.new_password = newPassword;
      }

      const res = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        setProfile(json.data);
        setNewPassword('');
        setConfirmPassword('');
        setMessage('Profile updated successfully');
      } else {
        setMessage(json.error);
      }
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage('Avatar must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      // Upload to storage via a simple approach
      // For now, we'll use a data URL as a simple solution
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setMessage('Failed to upload avatar');
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-12 text-center text-gray-500 dark:text-gray-400">Failed to load profile</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account settings</p>

      <div className="mt-6 max-w-lg">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(fullName || profile.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <label className="cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                {uploading ? 'Uploading...' : 'Change Avatar'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
            />
          </div>

          {/* Full Name */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Account info */}
          <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Password change */}
        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Messages & Save */}
        {message && (
          <p
            className={`mt-4 text-sm ${
              message.includes('success')
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
