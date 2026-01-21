import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface SoundNotificationContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  playNotificationSound: () => void;
  showPermissionModal: boolean;
  setShowPermissionModal: (show: boolean) => void;
  hasInteracted: boolean;
}

const SoundNotificationContext = createContext<SoundNotificationContextType | null>(null);

const SOUND_ENABLED_KEY = "cardapio_sound_enabled";
const PERMISSION_ASKED_KEY = "cardapio_sound_permission_asked";

export function SoundNotificationProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === "true";
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAskedPermission = useRef(localStorage.getItem(PERMISSION_ASKED_KEY) === "true");

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.wav");
    audioRef.current.preload = "auto";
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("scroll", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    document.addEventListener("scroll", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("scroll", handleInteraction);
    };
  }, []);

  // Show permission modal on first visit (only in admin panel)
  useEffect(() => {
    if (!hasAskedPermission.current && !soundEnabled) {
      // Small delay to let the page load
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!audioRef.current) return false;

    try {
      // Play silently to get browser permission
      audioRef.current.volume = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      
      setPermissionGranted(true);
      setSoundEnabled(true);
      localStorage.setItem(PERMISSION_ASKED_KEY, "true");
      hasAskedPermission.current = true;
      setShowPermissionModal(false);
      
      return true;
    } catch (error) {
      console.warn("Could not get audio permission:", error);
      return false;
    }
  }, [setSoundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      // Reset to start if already playing
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      audioRef.current.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
      });
    } catch (error) {
      console.warn("Error playing sound:", error);
    }
  }, [soundEnabled]);

  const dismissPermissionModal = useCallback(() => {
    setShowPermissionModal(false);
    localStorage.setItem(PERMISSION_ASKED_KEY, "true");
    hasAskedPermission.current = true;
  }, []);

  return (
    <SoundNotificationContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        permissionGranted,
        requestPermission,
        playNotificationSound,
        showPermissionModal,
        setShowPermissionModal: dismissPermissionModal,
        hasInteracted,
      }}
    >
      {children}
    </SoundNotificationContext.Provider>
  );
}

export function useSoundNotification() {
  const context = useContext(SoundNotificationContext);
  if (!context) {
    throw new Error("useSoundNotification must be used within a SoundNotificationProvider");
  }
  return context;
}
