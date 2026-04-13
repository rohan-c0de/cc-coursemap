"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAllStates } from "@/lib/states/registry";

interface AccountUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: string | null;
  defaultState: string | null;
}

interface Props {
  user: AccountUser;
  counts: {
    schedules: number;
    courses: number;
    transfers: number;
  };
}

export default function AccountDashboard({ user, counts }: Props) {
  const router = useRouter();
  const [defaultState, setDefaultState] = useState(user.defaultState ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const states = getAllStates();

  const handleSavePreferences = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        default_state: defaultState || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch {
      alert("Failed to delete account. Please try again.");
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-8">
        My Account
      </h1>

      {/* Profile section */}
      <section className="rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Profile
        </h2>
        <div className="flex items-center gap-4 mb-6">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-16 h-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <span className="text-xl font-bold text-teal-700 dark:text-teal-300">
                {user.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
          )}
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
              {user.displayName}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {user.email}
            </p>
            {user.authProvider && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                Signed in with{" "}
                {user.authProvider.charAt(0).toUpperCase() +
                  user.authProvider.slice(1)}
              </p>
            )}
          </div>
        </div>

        {/* Default state preference */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="default-state"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              Default state
            </label>
            <select
              id="default-state"
              value={defaultState}
              onChange={(e) => setDefaultState(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            >
              <option value="">None</option>
              {states.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>

      {/* Saved data summary */}
      <section className="rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Saved Data
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
            <p className="text-2xl font-bold text-teal-600">
              {counts.schedules}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Saved Schedules
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
            <p className="text-2xl font-bold text-teal-600">
              {counts.courses}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Bookmarked Courses
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
            <p className="text-2xl font-bold text-teal-600">
              {counts.transfers}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Transfer Comparisons
            </p>
          </div>
        </div>
        {counts.schedules + counts.courses + counts.transfers === 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-4 text-center">
            Nothing saved yet. Use the schedule builder, course search, or
            transfer tool and click the save/bookmark buttons to keep your work.
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-lg border border-red-200 dark:border-red-900/50 p-6">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Permanently delete your account and all saved data. This action cannot
          be undone.
        </p>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            Delete Account
          </button>
        )}
      </section>
    </div>
  );
}
