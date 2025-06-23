"use client";

import { useEffect, useState } from "react";
import { Cloud, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NextcloudStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'unconfigured'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setStatus('loading');
    try {
      const response = await fetch('/api/nextcloud/test');
      const data = await response.json();
      
      if (response.ok && data.status === 'connected') {
        setStatus('connected');
        setMessage(`Verbunden - ${data.projectFoldersCount} Projektordner`);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verbindung fehlgeschlagen');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Nextcloud nicht konfiguriert');
    }
  }

  const statusConfig = {
    loading: {
      icon: RefreshCw,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      text: 'Prüfe Verbindung...'
    },
    connected: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      text: message || 'Verbunden'
    },
    error: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      text: message || 'Nicht verbunden'
    },
    unconfigured: {
      icon: Cloud,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      text: 'Nicht konfiguriert'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${config.color} ${status === 'loading' ? 'animate-spin' : ''}`} />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Nextcloud</p>
            <p className={`text-sm ${config.color}`}>{config.text}</p>
          </div>
        </div>
        {status !== 'loading' && (
          <Button
            onClick={checkConnection}
            variant="ghost"
            size="icon"
            title="Verbindung erneut prüfen"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}