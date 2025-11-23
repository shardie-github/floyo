"use client";
import dynamic from "next/dynamic";
import { PropsWithChildren } from "react";
import { useConsent } from "@/hooks/useConsent";

export default function ConsentGate({ requireKey, children }: PropsWithChildren<{ requireKey: "analytics"|"marketing"|"functional" }>) {
  const { consent } = useConsent();
  if (!consent[requireKey]) return null;
  return <>{children}</>;
}
