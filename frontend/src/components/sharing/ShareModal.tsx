/**
 * Share Modal Component
 *
 * Modal for sharing recipes or libraries
 */

import React, { useState } from 'react';
import * as shareApi from '../../services/shareApi';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId?: string;
  libraryId?: string;
  itemName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  recipeId,
  libraryId,
  itemName,
}) => {
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateShare = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await shareApi.createShare({
        recipeId,
        libraryId,
        permission,
      });

      // Create full URL
      const fullUrl = `${window.location.origin}${result.shareUrl}`;
      setShareUrl(fullUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-soft-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-neutral-900">
            Share {recipeId ? 'Recipe' : 'Library'}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-neutral-600 mb-4">
          Create a shareable link for "{itemName}"
        </p>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3 mb-4">
            <p className="text-error-700 text-sm">{error}</p>
          </div>
        )}

        {!shareUrl ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Permission Level
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="view"
                    checked={permission === 'view'}
                    onChange={() => setPermission('view')}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">View only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="edit"
                    checked={permission === 'edit'}
                    onChange={() => setPermission('edit')}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Can edit</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShare}
                disabled={loading}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-700 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    copied
                      ? 'bg-success-500 text-white'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                Anyone with this link can {permission === 'view' ? 'view' : 'view and edit'} this {recipeId ? 'recipe' : 'library'}.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-neutral-600 text-white rounded-lg font-semibold hover:bg-neutral-700 transition"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
