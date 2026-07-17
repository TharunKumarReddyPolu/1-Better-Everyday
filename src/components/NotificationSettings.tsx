import React, { useState, useEffect } from 'react';
import { Bell, Clock, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NotificationSettingsProps {
  notificationsEnabled: boolean;
  notificationTime: string;
  onUpdateSettings: (enabled: boolean, time: string) => void;
  onSimulateNotification: (message: string) => void;
}

export default function NotificationSettings({
  notificationsEnabled,
  notificationTime,
  onUpdateSettings,
  onSimulateNotification
}: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(notificationsEnabled);
  const [time, setTime] = useState(notificationTime);
  const [testSuccess, setTestSuccess] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    setEnabled(notificationsEnabled);
    setTime(notificationTime);
  }, [notificationsEnabled, notificationTime]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported on this device.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        onUpdateSettings(true, time);
      }
    } catch (err) {
      console.warn('Failed to acquire permission state:', err);
    }
  };

  const handleSave = () => {
    onUpdateSettings(enabled, time);
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 3000);
  };

  const triggerTestNotification = () => {
    // Send standard accountability message
    const reminders = [
      "🔥 Time to make today 1% better! Tap to read your daily personality flashcard.",
      "🧠 Shift your mindset. Spend 2 minutes reading today's chosen emotional intelligence key.",
      "⏳ Keep your streak burning! Your custom growth goals are waiting for you.",
      "🚀 Leaders never stop reading. Spend some time building your active listening habits now!"
    ];
    const randomReminder = reminders[Math.floor(Math.random() * reminders.length)];
    onSimulateNotification(randomReminder);
  };

  return (
    <div className="bg-white border-4 border-brand-dark rounded-[32px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col" id="notifications-section">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-brand-pink border-2 border-brand-dark rounded-2xl text-brand-dark">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-brand-dark uppercase">Daily Accountability</h3>
          <p className="text-xs font-bold text-brand-dark/60 uppercase">Never miss a day of self-improvement</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-3.5 bg-brand-light border-2 border-brand-dark rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-0.5">
            <p className="text-sm font-black uppercase text-brand-dark">Daily Push Reminders</p>
            <p className="text-[11px] font-medium text-brand-dark/70">Receive customized notifications to your device</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                if (e.target.checked && permissionState !== 'granted') {
                  requestBrowserPermission();
                } else {
                  onUpdateSettings(e.target.checked, time);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-brand-dark/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-dark after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-brand-dark after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green border-2 border-brand-dark"></div>
          </label>
        </div>

        {/* Time Selector */}
        {enabled && (
          <div className="p-3.5 bg-brand-light border-2 border-brand-dark rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-orange" />
              <span className="text-sm font-black uppercase text-brand-dark">Preferred Time</span>
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                onUpdateSettings(enabled, e.target.value);
              }}
              className="bg-white border-2 border-brand-dark text-brand-dark text-sm rounded-xl focus:ring-0 p-2 font-mono font-black"
            />
          </div>
        )}

        {/* Permission Status Information */}
        {enabled && permissionState !== 'granted' && (
          <div className="bg-[#FFF4E5] border-2 border-brand-dark rounded-2xl p-4 flex items-start gap-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-black text-brand-dark uppercase">Browser Permissions Needed</p>
              <p className="text-brand-dark/80 mt-1 font-medium">
                Ensure you click the button below to enable real browser notifications, or click "Simulate Reminders" to test the flow directly in-app.
              </p>
              <button
                onClick={requestBrowserPermission}
                className="mt-2 text-[10px] font-black uppercase text-brand-blue hover:underline flex items-center gap-1 cursor-pointer"
              >
                Enable System Permission &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Settings feedback & action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-white hover:bg-brand-light text-brand-dark text-xs font-black uppercase rounded-xl border-2 border-brand-dark transition flex items-center justify-center gap-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
          >
            {testSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                Settings Saved
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
          <button
            onClick={triggerTestNotification}
            className="flex-1 px-4 py-2.5 bg-brand-green hover:bg-brand-green/85 text-brand-dark text-xs font-black uppercase rounded-xl border-2 border-brand-dark transition flex items-center justify-center gap-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Simulate Daily Reminder
          </button>
        </div>
      </div>
    </div>
  );
}
