"use client";
import { useEffect } from "react";
import ConsentGate from "./ConsentGate";
import integrationsConfig from "@/config/integrations.json";

export function CloudinaryIntegration() {
  if (!integrationsConfig.cloudinary) return null;

  // Cloudinary is initialized via next-cloudinary components
  // This component just ensures the config is available
  return null;
}

// Export Cloudinary components for use in pages
export { CldImage, CldUploadWidget } from "next-cloudinary";
