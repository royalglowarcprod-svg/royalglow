"use client";

import { useEffect, useState } from "react";
import ProductCard from "./productCard";

type Category = { id: number; name: string; slug: string };
type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category_id: number;
};

type ProductsResponse = { results: Product[] };
type CategoriesResponse = { results: Category[] };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ProductSection({ category }: { category: Category }) {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetch(`/api/products?category_id=${category.id}`)
      .then(r => r.json() as Promise<ProductsResponse>)
      .then(data => setProducts(shuffle(data.results || [])));
  }, [category.id]);
  return (
    <section id={`category-${category.slug}`}>
      <ProductCard
        title={category.name}
        products={products}
        categorySlug={category.slug}
      />
    </section>
  );
}

export default function ProductSections() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = (await res.json()) as CategoriesResponse;
      setCategories(shuffle(data.results || []));
    };

    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <div>
      {categories.map(category => (
        <ProductSection key={category.id} category={category} />
      ))}
    </div>
  );
}