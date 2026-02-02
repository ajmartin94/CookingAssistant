/**
 * Share Modal Component
 *
 * Modal for sharing recipes or libraries
 */

import React, { useState } from 'react';
import { X } from '../common/icons';
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
    } catch {
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
      <div className="bg-card rounded-lg shadow-soft-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-text-primary">
            Share {recipeId ? 'Recipe' : 'Library'}
          </h2>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-secondary"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-text-secondary mb-4">Create a shareable link for "{itemName}"</p>

        {error && (
          <div className="bg-error-subtle border border-error rounded-lg p-3 mb-4">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {!shareUrl ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
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
                    className="w-4 h-4 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-text-primary">View only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="edit"
                    checked={permission === 'edit'}
                    onChange={() => setPermission('edit')}
                    className="w-4 h-4 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-text-primary">Can edit</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-text-primary hover:text-text-primary font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShare}
                disabled={loading}
                className="px-4 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-default rounded-lg bg-secondary text-text-primary text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    copied
                      ? 'bg-success text-text-on-accent'
                      : 'bg-accent text-text-on-accent hover:bg-accent-hover'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-accent-subtle border border-accent rounded-lg p-3 mb-4">
              <p className="text-accent text-sm">
                Anyone with this link can {permission === 'view' ? 'view' : 'view and edit'} this{' '}
                {recipeId ? 'recipe' : 'library'}.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-secondary text-text-primary rounded-lg font-semibold hover:bg-hover transition"
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
