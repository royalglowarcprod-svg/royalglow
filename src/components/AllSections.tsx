"use client";
// Combo: PromoBanners + CategoryCarousel + BrandGrid all stacked
import PromoBanners from "./PromoBanners";
import CategoryCarousel from "./CategoryCarousel";
import BrandGrid from "./BrandGrid";

export default function AllSections() {
  return (
    <>
      <PromoBanners />
      <CategoryCarousel />
      <BrandGrid />
    </>
  );
}