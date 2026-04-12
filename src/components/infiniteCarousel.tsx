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

export default function HeroCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => r.json() as Promise<{ results: CarouselItem[] }>)
      .then(d => setItems(d.results || []));
  }, []);

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 500);
  }, [animating]);

  const next = useCallback(() => {
    goTo((current + 1) % items.length);
  }, [current, items.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + items.length) % items.length);
  }, [current, items.length, goTo]);

  // Auto-advance
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

  // Touch/drag support
  const dragStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const diff = dragStart.current - e.clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    dragStart.current = null;
  };

  if (items.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div
        className="hc-wrap"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* Slides */}
        <div className="hc-stage">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`hc-slide ${i === current ? "hc-slide--active" : ""} ${animating && i === current ? "hc-slide--exit" : ""}`}
            >
              <button
                className="hc-slide-btn"
                onClick={() => handleClick(item)}
                aria-label={`Go to ${item.link_type} ${item.link_value}`}
              >
                <img src={item.image_url} alt="" className="hc-img" draggable={false} />
              </button>
            </div>
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button className="hc-arrow hc-arrow--left" onClick={prev} aria-label="Previous">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className="hc-arrow hc-arrow--right" onClick={next} aria-label="Next">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Dots */}
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
      </div>
    </>
  );
}

const css = `
  .hc-wrap {
    position: relative;
    width: 100%;
    background: #111;
    overflow: hidden;
    border-bottom: 2px solid #111;
    user-select: none;
    touch-action: pan-y;
  }

  .hc-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 16/6;
  }

  @media (max-width: 600px) {
    .hc-stage { aspect-ratio: 4/3; }
  }

  .hc-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }
  .hc-slide--active {
    opacity: 1;
    pointer-events: auto;
    z-index: 1;
  }
  .hc-slide--exit {
    opacity: 0;
  }

  .hc-slide-btn {
    width: 100%; height: 100%;
    border: none; padding: 0; margin: 0;
    background: none; cursor: pointer;
    display: block;
  }

  .hc-img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
  }

  /* Arrows */
  .hc-arrow {
    position: absolute;
    top: 50%; transform: translateY(-50%);
    z-index: 10;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #111;
    box-shadow: 2px 2px 0 #111;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #111;
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .hc-arrow:hover {
    background: #FFE14D;
    transform: translateY(calc(-50% - 2px));
    box-shadow: 2px 4px 0 #111;
  }
  .hc-arrow--left  { left: 16px; }
  .hc-arrow--right { right: 16px; }

  @media (max-width: 600px) {
    .hc-arrow { width: 36px; height: 36px; }
    .hc-arrow--left  { left: 8px; }
    .hc-arrow--right { right: 8px; }
  }

  /* Dots */
  .hc-dots {
    position: absolute;
    bottom: 14px; left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex; gap: 8px; align-items: center;
  }
  .hc-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    border: none; padding: 0; cursor: pointer;
    transition: background 0.2s, transform 0.2s, width 0.2s;
  }
  .hc-dot--active {
    background: #FFE14D;
    width: 24px;
    border-radius: 4px;
    transform: none;
  }
`;