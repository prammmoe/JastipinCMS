"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export enum SnackbarType {
  Success = "success",
  Info = "info",
  Warning = "warning",
  Failed = "failed",
}

const SNACKBAR_ICONS: Record<SnackbarType, typeof Info> = {
  [SnackbarType.Success]: CheckCircle2,
  [SnackbarType.Info]: Info,
  [SnackbarType.Warning]: AlertTriangle,
  [SnackbarType.Failed]: XCircle,
};

type SnackbarProps = {
  message: string;
  type?: SnackbarType;
  duration?: number;
  onClose?: () => void;
};

export function Snackbar({
  message,
  type = SnackbarType.Info,
  duration = 3000,
  onClose,
}: SnackbarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 10);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const Icon = SNACKBAR_ICONS[type];

  return (
    <div className="snackbar" data-visible={visible} data-type={type} role="status">
      <Icon size={18} />
      <span>{message}</span>
    </div>
  );
}