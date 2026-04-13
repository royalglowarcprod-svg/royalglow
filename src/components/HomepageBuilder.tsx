"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

const PromoBanners     = dynamic(() => import("./PromoBanners"));
const CategoryCarousel = dynamic(() => import("./CategoryCarousel"));
const BrandGrid        = dynamic(() => import("./BrandGrid"));
const PromoAndCarousel = dynamic(() => import("./PromoAndCarousel"));
const AllSections      = dynamic(() => import("./AllSections"));
const ProductGrid      = dynamic(() => import("./cardDisplay"));

const COMPONENTS = {
  promo_banners:      PromoBanners,
  category_carousel:  CategoryCarousel,
  brand_grid:         BrandGrid,
  promo_and_carousel: PromoAndCarousel,
  all_sections:       AllSections,
  product_grid:       ProductGrid,
} as const;

export type SectionKey = keyof typeof COMPONENTS;
export interface SectionConfig { key: SectionKey; enabled: boolean }

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "promo_banners",      enabled: true  },
  { key: "category_carousel",  enabled: true  },
  { key: "brand_grid",         enabled: true  },
  { key: "promo_and_carousel", enabled: false },
  { key: "all_sections",       enabled: false },
  { key: "product_grid",       enabled: true  },
];

export const SECTION_REGISTRY: Record<SectionKey, { label: string }> = {
  promo_banners:      { label: "Promo Banners" },
  category_carousel:  { label: "Category Carousel" },
  brand_grid:         { label: "Brand Grid" },
  promo_and_carousel: { label: "Promo + Carousel" },
  all_sections:       { label: "All Sections" },
  product_grid:       { label: "Product Grid" },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomepageBuilder() {
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings?key=homepage_sections")
      .then(r => r.json() as Promise<{ settings?: Record<string, string> }>)
      .then(d => {
        const raw = d?.settings?.homepage_sections;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as SectionConfig[];
            setSections(DEFAULT_SECTIONS.map(def => parsed.find(p => p.key === def.key) ?? def));
          } catch {
            setSections(DEFAULT_SECTIONS);
          }
        } else {
          setSections(DEFAULT_SECTIONS);
        }
      })
      .catch(() => setSections(DEFAULT_SECTIONS))
      .finally(() => setLoaded(true));
  }, []);

  const shuffled = useMemo(() => {
    if (!loaded) return [];
    return shuffle(sections.filter(s => s.enabled));
  }, [loaded, sections]);

  if (!loaded) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <div style={{ width: 36, height: 36, border: "4px solid #eee", borderTopColor: "#FF3E5E", borderRadius: "50%", animation: "hb-spin .7s linear infinite" }} />
      <style>{`@keyframes hb-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (shuffled.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: "sans-serif", color: "#aaa", fontSize: "0.9rem" }}>
      No sections enabled. Go to Admin → Homepage tab to turn some on.
    </div>
  );

  return (
    <div>
      {shuffled.map(section => {
        const Component = COMPONENTS[section.key];
        return <div key={section.key}><Component /></div>;
      })}
    </div>
  );
}