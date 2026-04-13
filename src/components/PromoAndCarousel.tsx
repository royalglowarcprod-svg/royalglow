"use client";
// Combo: PromoBanners stacked above CategoryCarousel
import PromoBanners from "./PromoBanners";
import CategoryCarousel from "./CategoryCarousel";

export default function PromoAndCarousel() {
  return (
    <>
      <PromoBanners />
      <CategoryCarousel />
    </>
  );
}