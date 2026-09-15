"use client";
import { PageHeader } from "@/components/ui/page-header";
import { PasswordSection } from "./password-section";

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Kelola akun Anda." />
      <PasswordSection />
    </>
  );
}