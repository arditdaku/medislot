"use client";

import { useEffect, useState } from "react";
import { getMyProvider, updateMyProvider, type ProviderProfile } from "@/lib/api/doctor";
import { useToast } from "@/hooks/use-toast";

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [about, setAbout] = useState("");
  const [fees, setFees] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [is_active, setIsActive] = useState(true);
  
  const toast = useToast();
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await getMyProvider();
        if (!cancelled) {
          setProfile(data);
          setAbout(data.about || "");
          setFees(data.fees);
          setAddress(data.address || "");
          setIsActive(data.is_active);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Failed to load profile");
        }
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMyProvider({
        about,
        fees,
        address,
        is_active,
      });
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setAbout(profile.about || "");
      setFees(profile.fees);
      setAddress(profile.address || "");
      setIsActive(profile.is_active);
    }
    setEditing(false);
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">My Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        {/* Header Section */}
        <div className="flex items-start gap-6 border-b border-border pb-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-50 text-3xl font-bold text-primary">
            {initials(profile.full_name)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary">{profile.full_name}</h2>
            <p className="text-text-secondary">{profile.specialty}</p>
            {profile.experience && (
              <span className="mt-2 inline-block rounded-full bg-bg-muted px-3 py-1 text-xs font-semibold text-text-secondary">
                {profile.experience} experience
              </span>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="mt-6 space-y-6">
          {/* About */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              About
            </label>
            {editing ? (
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Tell patients about yourself..."
              />
            ) : (
              <p className="text-text-secondary">
                {profile.about || "No about section yet."}
              </p>
            )}
          </div>

          {/* Fee */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Consultation Fee (€)
            </label>
            {editing ? (
              <input
                type="number"
                value={fees ?? ""}
                onChange={(e) => setFees(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-border p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter fee amount"
              />
            ) : (
              <p className="text-text-secondary">
                {profile.fees != null ? `€${profile.fees}` : "Not set"}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Address
            </label>
            {editing ? (
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-border p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter your address"
              />
            ) : (
              <p className="text-text-secondary">
                {profile.address || "No address set"}
              </p>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={is_active}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={!editing}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-semibold text-text-primary">
                Available for appointments
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="mt-8 flex justify-end gap-3 border-t border-border pt-6">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}