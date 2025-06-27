"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Share2, Lock, Calendar, Copy, Check, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SharePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackedPlanId: string;
  planTitle: string;
}

export function SharePlanDialog({ isOpen, onClose, trackedPlanId, planTitle }: SharePlanDialogProps) {
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("never");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCreateLink() {
    setLoading(true);
    
    try {
      // Ablaufdatum berechnen
      let expiresAt = null;
      if (expiresIn !== "never") {
        const date = new Date();
        switch (expiresIn) {
          case "1day":
            date.setDate(date.getDate() + 1);
            break;
          case "7days":
            date.setDate(date.getDate() + 7);
            break;
          case "30days":
            date.setDate(date.getDate() + 30);
            break;
          case "90days":
            date.setDate(date.getDate() + 90);
            break;
        }
        expiresAt = date.toISOString();
      }

      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackedPlanId,
          password: password.trim() || null,
          expiresAt
        }),
      });

      if (!response.ok) throw new Error('Freigabe-Link konnte nicht erstellt werden');
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Fehler beim Erstellen des Freigabe-Links:', error);
      alert('Fehler beim Erstellen des Freigabe-Links');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    }
  }

  function handleClose() {
    onClose();
    // Reset state
    setTimeout(() => {
      setPassword("");
      setExpiresIn("never");
      setShareUrl("");
      setCopied(false);
    }, 300);
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Plan teilen: {planTitle}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!shareUrl ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Erstellen Sie einen sicheren Link, um die neueste Version dieses Plans zu teilen.
                </p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Passwortschutz (optional)
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leer lassen für öffentlichen Zugriff"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="expires" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Gültigkeit
                    </label>
                    <Select
                      value={expiresIn}
                      onValueChange={(value) => setExpiresIn(value)}
                    >
                      <SelectTrigger id="expires" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Unbegrenzt</SelectItem>
                        <SelectItem value="1day">1 Tag</SelectItem>
                        <SelectItem value="7days">7 Tage</SelectItem>
                        <SelectItem value="30days">30 Tage</SelectItem>
                        <SelectItem value="90days">90 Tage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateLink}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Erstelle Link...' : 'Link erstellen'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Freigabe-Link erstellt!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Teilen Sie diesen Link mit externen Partnern, um ihnen Zugriff auf die neueste Version des Plans zu geben.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Freigabe-Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                      title="Link kopieren"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                      title="In neuem Tab öffnen"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {(password || expiresIn !== "never") && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">Link-Eigenschaften:</p>
                    <ul className="text-amber-700 dark:text-amber-400 space-y-1">
                      {password && <li>• Passwortgeschützt</li>}
                      {expiresIn !== "never" && <li>• Gültig für {expiresIn === "1day" ? "1 Tag" : expiresIn === "7days" ? "7 Tage" : expiresIn === "30days" ? "30 Tage" : "90 Tage"}</li>}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Fertig
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}