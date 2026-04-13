"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string; slug: string; image_url?: string };
const SPEED = 55;

export default function CategoryCarousel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
 const animRef = useRef<number | null>(null);
  const paused   = useRef(false);
  const pos      = useRef(0);
  const router   = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json() as Promise<{ results: Category[] }>)
      .then(d => setCategories(d.results || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || categories.length === 0) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (!paused.current) {
        pos.current -= SPEED * dt;
        const half = track.scrollWidth / 2;
        if (Math.abs(pos.current) >= half) pos.current = 0;
        track.style.transform = `translateX(${pos.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [categories]);

  if (categories.length === 0) return null;

  const items = [...categories, ...categories, ...categories];

  return (
    <>
      <style>{css}</style>
      <section className="cc-section">
        <div className="cc-head">
          <h2 className="cc-title">Shop by Category</h2>
          <div className="cc-line" />
        </div>
        <div className="cc-viewport"
          onMouseEnter={() => { paused.current = true; }}
          onMouseLeave={() => { paused.current = false; }}
        >
          <div className="cc-fade cc-fade--l" />
          <div className="cc-fade cc-fade--r" />
          <div className="cc-track" ref={trackRef}>
            {items.map((cat, i) => (
              <button key={`${cat.id}-${i}`} className="cc-item" onClick={() => router.push(`/?category=${cat.slug}`)}>
                <div className="cc-circle">
                  {cat.image_url
                    ? <img src={cat.image_url} alt={cat.name} className="cc-img" />
                    : <span className="cc-fb">{cat.name[0]}</span>}
                </div>
                <span className="cc-label">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;700;800&display=swap');
  .cc-section { padding: 28px 0 36px; font-family: 'Jost', sans-serif; overflow: hidden; }
  .cc-head { display: flex; align-items: center; gap: 14px; padding: 0 24px; margin-bottom: 22px; max-width: 1400px; margin-left: auto; margin-right: auto; }
  .cc-title { font-size: 1.25rem; font-weight: 800; color: #111; white-space: nowrap; letter-spacing: -.02em; margin: 0; }
  .cc-line { flex: 1; height: 2.5px; background: #111; border-radius: 1px; }
  .cc-viewport { position: relative; width: 100%; overflow: hidden; }
  .cc-fade { position: absolute; top: 0; bottom: 0; width: 70px; z-index: 2; pointer-events: none; }
  .cc-fade--l { left: 0; background: linear-gradient(to right, #f5f5f5, transparent); }
  .cc-fade--r { right: 0; background: linear-gradient(to left, #f5f5f5, transparent); }
  .cc-track { display: flex; gap: 18px; padding: 8px 40px; width: max-content; will-change: transform; }
  .cc-item { display: flex; flex-direction: column; align-items: center; gap: 9px; background: none; border: none; cursor: pointer; flex-shrink: 0; padding: 4px; transition: transform .2s; }
  .cc-item:hover { transform: translateY(-4px); }
  .cc-circle { width: 88px; height: 88px; border-radius: 50%; border: 2.5px solid #111; box-shadow: 4px 4px 0 #111; overflow: hidden; background: #FFF5F7; display: flex; align-items: center; justify-content: center; transition: box-shadow .2s, border-color .2s; flex-shrink: 0; }
  .cc-item:hover .cc-circle { box-shadow: 5px 5px 0 #FF3E5E; border-color: #FF3E5E; }
  .cc-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .cc-item:hover .cc-img { transform: scale(1.1); }
  .cc-fb { font-size: 1.8rem; font-weight: 900; color: #FF3E5E; }
  .cc-label { font-size: .76rem; font-weight: 800; color: #111; text-align: center; max-width: 88px; line-height: 1.3; }
`;