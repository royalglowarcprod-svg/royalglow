"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string; slug: string; image_url?: string };

export default function CategoryCircles() {
  const [categories, setCategories] = useState<Category[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json() as Promise<{ results: Category[] }>)
      .then(d => setCategories(d.results || []));
  }, []);

  if (categories.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div className="cc-circles-wrap">
        <div className="cc-circles-track" ref={trackRef}>
          {categories.map(cat => (
            <button key={cat.id} className="cc-circle-item"
              onClick={() => router.push(`/category/${cat.slug}`)}>
              <div className="cc-circle-ring">
                <div className="cc-circle-img-wrap">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="cc-circle-img" />
                  ) : (
                    <div className="cc-circle-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <span className="cc-circle-label">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const css = `
  .cc-circles-wrap {
    width: 100%;
    padding: 16px 20px 12px;
    background: #fff;
    border-bottom: 2px solid #111;
  }
  .cc-circles-track {
    display: flex; gap: 18px;
    overflow-x: auto; scrollbar-width: none;
    padding-bottom: 4px;
  }
  .cc-circles-track::-webkit-scrollbar { display: none; }
  .cc-circle-item {
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    background: none; border: none; cursor: pointer; flex-shrink: 0; padding: 0;
    transition: transform 0.18s;
  }
  .cc-circle-item:hover { transform: translateY(-3px); }
  .cc-circle-ring {
    width: 66px; height: 66px; border-radius: 50%;
    background: linear-gradient(135deg, #FF3E5E, #FFE14D, #00D084);
    padding: 2.5px; transition: background 0.25s;
  }
  .cc-circle-item:hover .cc-circle-ring {
    background: linear-gradient(135deg, #111, #444);
  }
  .cc-circle-img-wrap {
    width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
    background: #f5f5f5; border: 2.5px solid #fff;
    display: flex; align-items: center; justify-content: center;
  }
  .cc-circle-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
  .cc-circle-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    background: #f0f0f0; color: #aaa; border-radius: 50%;
  }
  .cc-circle-label {
    font-family: 'Jost', sans-serif; font-size: 0.68rem; font-weight: 600;
    color: #111; text-align: center; max-width: 70px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.02em;
  }
`;