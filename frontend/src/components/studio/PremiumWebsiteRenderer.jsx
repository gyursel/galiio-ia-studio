import React, { useMemo } from "react";
import { getPremiumRenderer } from "./renderers";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) out[key] = cloneValue(val);
    return out;
  }
  return value;
}

function setNestedValue(target, path, value) {
  if (!target || !path || typeof path !== "string") return target;

  const parts = path.split(".").filter(Boolean);
  if (!parts.length) return target;

  let cursor = target;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const shouldBeArray = /^\d+$/.test(nextKey);

    if (Array.isArray(cursor)) {
      const index = Number(key);
      if (!cursor[index]) cursor[index] = shouldBeArray ? [] : {};
      cursor = cursor[index];
      continue;
    }

    if (!isPlainObject(cursor[key]) && !Array.isArray(cursor[key])) {
      cursor[key] = shouldBeArray ? [] : {};
    }

    cursor = cursor[key];
  }

  const lastKey = parts[parts.length - 1];

  if (Array.isArray(cursor) && /^\d+$/.test(lastKey)) {
    cursor[Number(lastKey)] = value;
  } else {
    cursor[lastKey] = value;
  }

  return target;
}

function applyVisualOverrides(website) {
  const next = cloneValue(website || {});
  const overrides = next.overrides || {};

  for (const [id, patch] of Object.entries(overrides)) {
    if (!id || !patch || typeof patch !== "object") continue;

    if (typeof patch.text === "string") {
      const textPath = id.startsWith("customElements.") ? `${id}.text` : id;
      setNestedValue(next, textPath, patch.text);
    }

    if (typeof patch.mediaUrl === "string") {
      setNestedValue(next, id, patch.mediaUrl);
    }
  }

  return next;
}

export default function PremiumWebsiteRenderer(props) {
  const websiteWithOverrides = useMemo(
    () => applyVisualOverrides(props.website),
    [props.website]
  );

  const Renderer = getPremiumRenderer(websiteWithOverrides?.rendererStyle);

  return <Renderer {...props} website={websiteWithOverrides} />;
}
