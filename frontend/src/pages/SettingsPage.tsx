/**
 * Settings Page
 *
 * User settings for profile, preferences, and account management.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  Skeleton,
} from '../components/ui';

interface ProfileFormData {
  fullName: string;
  email: string;
  username: string;
}

interface PreferencesData {
  defaultServings: number;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [profile, setProfile] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    username: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState<PreferencesData>({
    defaultServings: 4,
  });

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        username: user.username || '',
      });
      setLoading(false);
    }
  }, [user]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveProfile = async () => {
    setError(null);
    setSaveSuccess(false);

    // Validate email
    if (!validateEmail(profile.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      await updateUser({
        full_name: profile.fullName,
        email: profile.email,
      });
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      await updateUser({
        password: passwordData.newPassword,
      });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // In a real app, this would call an API to delete the account
    // For now, we just close the modal
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">Settings</h1>
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-lg animate-pulse" />
          <Skeleton className="h-40 rounded-lg animate-pulse" />
          <Skeleton className="h-48 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">Settings</h1>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-success-100 text-success-700 rounded-lg">
          Changes saved successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-danger-100 text-danger-700 rounded-lg">{error}</div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Profile</h2>
            <div className="space-y-4 max-w-md">
              <Input
                label="Username"
                value={profile.username}
                disabled
                helperText="Username cannot be changed"
              />
              <Input
                label="Full Name"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Preferences</h2>
            <div className="space-y-4 max-w-md">
              <Input
                label="Default Servings"
                type="number"
                min={1}
                max={20}
                value={preferences.defaultServings}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    defaultServings: parseInt(e.target.value) || 4,
                  })
                }
                helperText="Default number of servings for new recipes"
              />
              <p className="text-sm text-neutral-500">
                More preference options coming soon, including dietary restrictions and
                measurement units.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Account Section */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </Button>
              </div>
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 mb-3">
                  Deleting your account will permanently remove all your recipes, libraries,
                  and data. This action cannot be undone.
                </p>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  Delete Account
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
          />
          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleChangePassword} disabled={saving}>
              {saving ? 'Saving...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Are you sure you want to delete your account? This action cannot be undone and
            all your data will be permanently lost.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
