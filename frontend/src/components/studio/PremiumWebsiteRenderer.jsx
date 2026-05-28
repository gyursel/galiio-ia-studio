import React from "react";
import { getPremiumRenderer } from "./renderers";

export default function PremiumWebsiteRenderer(props) {
  const Renderer = getPremiumRenderer(props.website?.rendererStyle);
  return <Renderer {...props} />;
}