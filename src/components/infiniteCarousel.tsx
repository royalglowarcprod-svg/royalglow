"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type CarouselItem = {
  id: number;
  image_url: string;
  link_type: string;
  link_value: string;
  sort_order: number;
};

const SIDE_VW = 12; // visible width of each side card in vw
const GAP = 10;     // px gap between cards

export default function HeroCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dims, setDims] = useState({ centerW: 0, centerH: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dragStart = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => r.json() as Promise<{ results: CarouselItem[] }>)
      .then(d => setItems(d.results || []));
  }, []);

  const recalc = useCallback(() => {
    if (!sceneRef.current) return;
    const sideVisible = (window.innerWidth * SIDE_VW) / 100;
    const centerW = sceneRef.current.offsetWidth - 2 * (sideVisible + GAP);
    const centerH = Math.round(centerW / (16 / 6.2));
    setDims({ centerW, centerH });
  }, []);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  const goTo = useCallback((idx: number) => {
    if (sliding || idx === current) return;
    setSliding(true);
    setCurrent(idx);
    setTimeout(() => setSliding(false), 490);
  }, [sliding, current]);

  const next = useCallback(() => goTo((current + 1) % items.length), [current, items.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + items.length) % items.length), [current, items.length, goTo]);

  useEffect(() => {
    if (items.length === 0) return;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) next();
        schedule();
      }, 4000);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [items.length, next]);

  const handleClick = (item: CarouselItem) => {
    if (item.link_type === "product") router.push(`/products/${item.link_value}`);
    else router.push(`/category/${item.link_value}`);
  };

  const sideVisible = typeof window !== "undefined" ? (window.innerWidth * SIDE_VW) / 100 : 80;
  const trackX = -(current * (dims.centerW + GAP)) + sideVisible + GAP;

  if (items.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div className="hc-outer">
        <div
          ref={sceneRef}
          className="hc-scene"
          onMouseEnter={() => { pausedRef.current = true; setHovered(true); }}
          onMouseLeave={() => { pausedRef.current = false; setHovered(false); }}
          onPointerDown={e => { dragStart.current = e.clientX; }}
          onPointerUp={e => {
            if (dragStart.current === null) return;
            const diff = dragStart.current - e.clientX;
            if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            dragStart.current = null;
          }}
        >
          <div
            className="hc-track"
            style={{ transform: `translateX(${trackX}px)` }}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                className="hc-slide"
                style={{
                  width: dims.centerW,
                  height: dims.centerH,
                  marginLeft: i === 0 ? 0 : GAP,
                  transform: i === current ? "scale(1)" : "scale(0.9)",
                  opacity: i === current ? 1 : 0.65,
                }}
                onClick={() => i !== current ? goTo(i) : handleClick(item)}
              >
                <button
                  className="hc-card-btn"
                  onClick={() => i === current && handleClick(item)}
                  aria-label={`Go to ${item.link_type} ${item.link_value}`}
                  tabIndex={i === current ? 0 : -1}
                >
                  <img src={item.image_url} alt="" className="hc-img" draggable={false} />
                </button>
              </div>
            ))}
          </div>

          {items.length > 1 && (
            <>
              <button className={`hc-arrow hc-arrow--left ${hovered ? "hc-arrow--visible" : ""}`} onClick={prev} aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button className={`hc-arrow hc-arrow--right ${hovered ? "hc-arrow--visible" : ""}`} onClick={next} aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {items.length > 1 && (
          <div className="hc-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`hc-dot ${i === current ? "hc-dot--active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  .hc-outer {
    width: 100%;
    padding: 20px 0 18px;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    overflow: hidden;
  }
  .hc-scene {
    position: relative;
    width: 100%;
    overflow: hidden;
    user-select: none;
    touch-action: pan-y;
  }
  .hc-track {
    display: flex;
    align-items: center;
    transition: transform 0.48s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  .hc-slide {
    flex-shrink: 0;
    border-radius: 14px;
    overflow: hidden;
    transition: transform 0.48s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.48s;
    cursor: pointer;
  }
  .hc-card-btn {
    width: 100%; height: 100%;
    border: none; padding: 0; margin: 0;
    background: none; cursor: pointer; display: block;
  }
  .hc-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
    display: block; pointer-events: none;
  }
  .hc-arrow {
    position: absolute;
    top: 50%; transform: translateY(-50%);
    z-index: 10;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #111;
    opacity: 0;
    transition: opacity 0.2s, background 0.15s, transform 0.15s;
    pointer-events: none;
  }
  .hc-arrow--visible { opacity: 1; pointer-events: auto; }
  .hc-arrow:hover { background: #FFE14D; transform: translateY(calc(-50% - 2px)); }
  .hc-arrow--left  { left: 16px; }
  .hc-arrow--right { right: 16px; }
  .hc-dots { display: flex; gap: 6px; align-items: center; }
  .hc-dot {
    height: 8px; width: 8px; border-radius: 4px;
    background: #888; border: none; padding: 0; cursor: pointer;
    transition: background 0.25s, width 0.3s;
  }
  .hc-dot--active {
    background: #FFE14D;
    width: 28px;
    outline: 2px solid #111;
    outline-offset: 1px;
  }
`;