"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { HomepageSection } from "@/app/api/homepage-sections/route";

const PromoBanners     = dynamic(() => import("./PromoBanners"));
const CategoryCarousel = dynamic(() => import("./CategoryCarousel"));
const BrandGrid        = dynamic(() => import("./BrandGrid"));
const PromoAndCarousel = dynamic(() => import("./PromoAndCarousel"));
const AllSections      = dynamic(() => import("./AllSections"));
const ProductGrid      = dynamic(() => import("./cardDisplay"));

const COMPONENTS: Record<string, React.ComponentType> = {
  promo_banners:      PromoBanners,
  category_carousel:  CategoryCarousel,
  brand_grid:         BrandGrid,
  promo_and_carousel: PromoAndCarousel,
  all_sections:       AllSections,
  product_grid:       ProductGrid,
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
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/homepage-sections")
      .then(r => r.json() as Promise<{ results: HomepageSection[] }>)
      .then(d => setSections(d.results ?? []))
      .catch(() => setSections([]))
      .finally(() => setLoaded(true));
  }, []);

  const shuffled = useMemo(() => {
    if (!loaded) return [];
    return shuffle(sections.filter(s => s.enabled === 1));
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
        const Component = COMPONENTS[section.type];
        if (!Component) return null;
        return <div key={section.id}><Component /></div>;
      })}
    </div>
  );
}