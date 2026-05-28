function humanizeRendererName(fileName) {
  return String(fileName || "")
    .replace("./", "")
    .replace(".jsx", "")
    .replace(/Renderer$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/Premium/g, "Premium")
    .trim();
}

function makeRendererId(fileName) {
  const base = String(fileName || "")
    .replace("./", "")
    .replace(".jsx", "")
    .replace(/Renderer$/, "");

  const aliases = {
    Auravitae: "auravitae",
    ClassicPremium: "classic",
    Nexora: "nexora",
    Atelier: "atelier",
    Obsidian: "obsidian",
    Prism: "prism",
    Terra: "terra",
    Monaco: "monaco",
  };

  if (aliases[base]) return aliases[base];

  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

function descriptionFor(id, name) {
  const descriptions = {
    auravitae: "Cinematic luxury layout with mandatory video background, glass cards and editorial premium rhythm.",
    classic: "Light cream editorial premium layout.",
    nexora: "Dark futuristic tech renderer with neon dashboard panels and mandatory video background.",
    atelier: "Luxury magazine-style renderer with serif typography, asymmetric editorial layout and video background.",
    obsidian: "Ultra black-and-white brutalist luxury renderer with hard grids, oversized typography and video atmosphere.",
    prism: "Colorful premium product/showroom renderer with 3D cards, gradients and video background.",
    terra: "Warm natural wellness/eco premium renderer with organic shapes, earthy colors and video background.",
    monaco: "Navy/gold executive renderer for finance, legal, consulting and premium professional services.",
  };

  return descriptions[id] || `${name} premium renderer loaded automatically from the renderers folder.`;
}

const context = require.context("./", false, /Renderer\.jsx$/);

export const PREMIUM_RENDERERS = context
  .keys()
  .map((key) => {
    const Renderer = context(key).default;
    const id = makeRendererId(key);
    const name = humanizeRendererName(key);

    return {
      id,
      name,
      description: descriptionFor(id, name),
      Renderer,
      file: key.replace("./", ""),
    };
  })
  .filter((item) => item.id && item.Renderer)
  .sort((a, b) => {
    const order = [
      "auravitae",
      "classic",
      "nexora",
      "atelier",
      "obsidian",
      "prism",
      "terra",
      "monaco",
    ];

    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);

    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    }

    return a.name.localeCompare(b.name);
  })
  .slice(0, 20);

export function getPremiumRenderer(style) {
  const id = String(style || "auravitae").trim().toLowerCase();
  return PREMIUM_RENDERERS.find((item) => item.id === id)?.Renderer || PREMIUM_RENDERERS[0]?.Renderer;
}
