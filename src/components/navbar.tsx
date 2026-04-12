"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import style from "../styles/navBar.module.css";
import FloatingCart from "./floatingCart";
import HamburgerMenu from "./hamburgerMenu";

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com", "halayjan18@gmail.com"];

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category_name: string;
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const userInitial = (user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as { results: Product[] };
        setSuggestions((data.results || []).slice(0, 6));
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
  };

  const highlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#FFE14D", color: "#111", borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <>
      <style>{navCss}</style>
      <nav className={`cc-nav ${scrolled ? "cc-nav--scrolled" : ""}`}>

        {/* Logo */}
        <button className="cc-logo" onClick={() => router.push("/")} aria-label="Go to home">
          <span className="cc-logo__icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </span>
          <span className="cc-logo__text">CrashCart</span>
        </button>

        {/* Search Bar — center */}
        {!isMobile && (
          <div className="cc-search-wrap" ref={searchWrapRef}>
            <form className={`cc-search ${searchFocused ? "cc-search--focused" : ""}`} onSubmit={handleSearch}>
              <svg className="cc-search__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="cc-search__input"
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
                autoComplete="off"
              />
              {searchLoading && <div className="cc-search__spinner"/>}
              {searchQuery && (
                <button type="button" className="cc-search__clear"
                  onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="cc-suggestions">
                <div className="cc-suggestions__header">
                  <span>Results for "{searchQuery}"</span>
                </div>
                {suggestions.map((product, i) => (
                  <button
                    key={product.id}
                    className="cc-suggestion-item"
                    onClick={() => { setShowSuggestions(false); setSearchQuery(""); router.push(`/products/${product.id}`); }}
                  >
                    <div className="cc-suggestion-item__img-wrap">
                      <img
                        src={product.image_url || "https://placehold.co/48x48?text=?"}
                        alt={product.name}
                        className="cc-suggestion-item__img"
                      />
                    </div>
                    <div className="cc-suggestion-item__info">
                      <span className="cc-suggestion-item__name">
                        {highlight(product.name, searchQuery)}
                      </span>
                      {product.category_name && (
                        <span className="cc-suggestion-item__cat">{product.category_name}</span>
                      )}
                    </div>
                    <span className="cc-suggestion-item__price">RS {product.price.toFixed(2)}</span>
                    <svg className="cc-suggestion-item__arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
                <button
                  className="cc-suggestions__footer"
                  onClick={() => { setShowSuggestions(false); router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  See all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        )}

        {/* Desktop Nav Links */}
        <ul className="cc-links">
          <li>
            <button className="cc-link" onClick={() => router.push("/")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </button>
          </li>
          <li>
            <button className="cc-link" onClick={() => router.push("/orders")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              Orders
            </button>
          </li>
          {isAdmin && (
            <li>
              <button className="cc-link cc-link--admin" onClick={() => router.push("/admin")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin
              </button>
            </li>
          )}
        </ul>

        {/* Auth */}
        <div className="cc-auth">
          {!user ? (
            <>
              <button className="cc-btn cc-btn--ghost" onClick={() => router.push("/login")}>Sign In</button>
              <button className="cc-btn cc-btn--primary" onClick={() => router.push("/register")}>Sign Up</button>
            </>
          ) : (
            !isMobile && (
              <div className="cc-user" ref={dropdownRef}>
                <button className="cc-avatar" onClick={() => setDropdownOpen(o => !o)} aria-label="User menu">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="cc-avatar__img"/>
                  ) : (
                    <span className="cc-avatar__initial">{userInitial}</span>
                  )}
                  <span className="cc-avatar__name">{userName}</span>
                  <svg className={`cc-avatar__chevron ${dropdownOpen ? "cc-avatar__chevron--open" : ""}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="cc-dropdown">
                    <div className="cc-dropdown__header">
                      <span className="cc-dropdown__name">{userName}</span>
                      <span className="cc-dropdown__email">{user.email}</span>
                    </div>
                    <div className="cc-dropdown__divider"/>
                    <button className="cc-dropdown__item" onClick={() => { router.push("/orders"); setDropdownOpen(false); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                      My Orders
                    </button>
                    {isAdmin && (
                      <button className="cc-dropdown__item cc-dropdown__item--admin" onClick={() => { router.push("/admin"); setDropdownOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Admin Panel
                      </button>
                    )}
                    <div className="cc-dropdown__divider"/>
                    <button className="cc-dropdown__item cc-dropdown__item--danger" onClick={handleSignOut}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`${style.hamburger} ${menuOpen ? style.active : ""}`}
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span/><span/><span/>
        </button>
      </nav>

      {menuOpen && <div className={style.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true"/>}
      <HamburgerMenu isOpen={menuOpen} closeMenu={() => setMenuOpen(false)}/>
      <FloatingCart/>
    </>
  );
}

const navCss = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap');

  .cc-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; gap: 12px;
    font-family: 'Jost', sans-serif;
    background: #ffffff;
    border-bottom: 2.5px solid #111;
    transition: box-shadow 0.2s ease;
  }
  .cc-nav--scrolled { box-shadow: 0 4px 0 #111; }

  /* ── Logo ── */
  .cc-logo {
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0;
  }
  .cc-logo__icon {
    width: 34px; height: 34px;
    background: #FF3E5E; border: 2px solid #111; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; box-shadow: 3px 3px 0 #111; transition: transform 0.18s;
  }
  .cc-logo:hover .cc-logo__icon { transform: rotate(-6deg) scale(1.08); }
  .cc-logo__text { font-size: 1.1rem; font-weight: 700; color: #111; letter-spacing: -0.02em; }

  /* ── Search ── */
  .cc-search-wrap {
    flex: 1;
    max-width: 460px;
    position: relative;
    z-index: 101;
  }
  .cc-search {
    display: flex; align-items: center; gap: 8px;
    background: #f5f5f5;
    border: 2px solid #111;
    border-radius: 100px;
    padding: 0 14px;
    height: 38px;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .cc-search--focused {
    background: #fff;
    box-shadow: 3px 3px 0 #111;
  }
  .cc-search__icon {
    color: #FF3E5E;
    flex-shrink: 0;
  }
  .cc-search__input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: 'Jost', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
    color: #111;
    min-width: 0;
    box-shadow: none !important;
  }
  .cc-search__input::placeholder { color: #aaa; font-weight: 400; }
  .cc-search__input:focus { outline: none; box-shadow: none; border: none; }
  .cc-search__spinner {
    width: 14px; height: 14px; flex-shrink: 0;
    border: 2px solid #ddd; border-top-color: #FF3E5E;
    border-radius: 50%; animation: ccSpin 0.6s linear infinite;
  }
  @keyframes ccSpin { to { transform: rotate(360deg); } }
  .cc-search__clear {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; flex-shrink: 0;
    background: #eee; border: none; border-radius: 50%;
    color: #666; cursor: pointer; transition: background 0.15s, color 0.15s;
    padding: 0;
  }
  .cc-search__clear:hover { background: #111; color: #fff; }

  /* ── Suggestions ── */
  .cc-suggestions {
    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
    background: #fff;
    border: 2px solid #111;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 4px 4px 0 #111;
    animation: ccDropIn 0.18s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes ccDropIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to   { opacity: 1; transform: none; }
  }
  .cc-suggestions__header {
    padding: 8px 14px 6px;
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #aaa;
    border-bottom: 1.5px solid #f0f0f0;
  }
  .cc-suggestion-item {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; background: none; border: none;
    border-bottom: 1px solid #f5f5f5; cursor: pointer;
    text-align: left; transition: background 0.12s;
  }
  .cc-suggestion-item:last-of-type { border-bottom: none; }
  .cc-suggestion-item:hover { background: #FFF9E6; }
  .cc-suggestion-item__img-wrap {
    width: 44px; height: 44px; flex-shrink: 0;
    border-radius: 10px; overflow: hidden;
    border: 1.5px solid #111;
  }
  .cc-suggestion-item__img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .cc-suggestion-item__info {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 2px;
  }
  .cc-suggestion-item__name {
    font-size: 0.86rem; font-weight: 600; color: #111;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-family: 'Jost', sans-serif;
  }
  .cc-suggestion-item__cat {
    font-size: 0.72rem; color: #999; font-family: 'Jost', sans-serif;
  }
  .cc-suggestion-item__price {
    font-size: 0.86rem; font-weight: 700; color: #FF3E5E;
    flex-shrink: 0; font-family: 'Jost', sans-serif;
  }
  .cc-suggestion-item__arrow {
    color: #ccc; flex-shrink: 0; transition: color 0.15s, transform 0.15s;
  }
  .cc-suggestion-item:hover .cc-suggestion-item__arrow {
    color: #111; transform: translateX(2px);
  }
  .cc-suggestions__footer {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 14px; background: #f9f9f9; border: none; border-top: 1.5px solid #eee;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 700; color: #111;
    cursor: pointer; transition: background 0.15s;
  }
  .cc-suggestions__footer:hover { background: #FFE14D; }

  /* ── Nav Links ── */
  .cc-links {
    display: flex; align-items: center; gap: 4px;
    list-style: none; margin: 0; padding: 0; flex-shrink: 0;
  }
  .cc-link {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 14px; background: none; border: 2px solid transparent; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 600;
    color: #444; letter-spacing: 0.04em; border-radius: 100px; transition: all 0.15s;
  }
  .cc-link:hover {
    background: #FFE14D; border-color: #111; color: #111;
    box-shadow: 2px 2px 0 #111; transform: translateY(-1px);
  }
  .cc-link svg { opacity: 0.5; transition: opacity 0.15s; flex-shrink: 0; }
  .cc-link:hover svg { opacity: 1; }
  .cc-link--admin { color: #7C3AED; }
  .cc-link--admin:hover { background: #EDE9FE; border-color: #7C3AED; color: #7C3AED; box-shadow: 2px 2px 0 #7C3AED; }

  /* ── Auth ── */
  .cc-auth { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cc-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 8px 18px; font-family: 'Jost', sans-serif; font-size: 0.8rem;
    font-weight: 700; letter-spacing: 0.06em; border-radius: 100px;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .cc-btn--ghost { background: #fff; color: #111; border: 2px solid #111; }
  .cc-btn--ghost:hover { background: #f5f5f5; transform: translateY(-1px); box-shadow: 2px 2px 0 #111; }
  .cc-btn--primary { background: #00D084; color: #111; border: 2px solid #111; font-weight: 700; }
  .cc-btn--primary:hover { background: #00E891; transform: translateY(-1px); box-shadow: 3px 3px 0 #111; }

  /* ── User avatar ── */
  .cc-user { position: relative; }
  .cc-avatar {
    display: flex; align-items: center; gap: 6px;
    background: #fff; border: 2px solid #111; border-radius: 100px;
    padding: 4px 12px 4px 4px; cursor: pointer; transition: all 0.15s;
  }
  .cc-avatar:hover { background: #FFE14D; box-shadow: 2px 2px 0 #111; transform: translateY(-1px); }
  .cc-avatar__img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1.5px solid #111; }
  .cc-avatar__initial {
    width: 26px; height: 26px; border-radius: 50%;
    background: #FF3E5E; color: #fff; border: 1.5px solid #111;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700;
  }
  .cc-avatar__name { font-size: 0.78rem; font-weight: 600; color: #111; }
  .cc-avatar__chevron { color: #555; transition: transform 0.2s; }
  .cc-avatar__chevron--open { transform: rotate(180deg); }

  /* ── Dropdown ── */
  .cc-dropdown {
    position: absolute; top: calc(100% + 10px); right: 0;
    min-width: 210px; background: #fff;
    border: 2px solid #111; border-radius: 16px; padding: 6px;
    box-shadow: 4px 4px 0 #111;
    animation: ccPopIn 0.18s cubic-bezier(.22,1,.36,1) both; z-index: 200;
  }
  @keyframes ccPopIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.95); }
    to   { opacity: 1; transform: none; }
  }
  .cc-dropdown__header { padding: 10px 12px 8px; }
  .cc-dropdown__name { display: block; font-size: 0.88rem; font-weight: 700; color: #111; }
  .cc-dropdown__email { display: block; font-size: 0.72rem; color: #888; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 186px; }
  .cc-dropdown__divider { height: 1px; background: rgba(0,0,0,0.1); margin: 4px 0; }
  .cc-dropdown__item {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 9px 12px; background: none; border: none;
    border-radius: 10px; cursor: pointer; font-family: 'Jost', sans-serif;
    font-size: 0.82rem; font-weight: 500; color: #444; text-align: left; transition: all 0.12s;
  }
  .cc-dropdown__item:hover { background: #FFE14D; color: #111; }
  .cc-dropdown__item--admin { color: #7C3AED; }
  .cc-dropdown__item--admin:hover { background: #EDE9FE; color: #7C3AED; }
  .cc-dropdown__item--danger { color: #E11D48; }
  .cc-dropdown__item--danger:hover { background: #FFF1F5; color: #E11D48; }

  /* ── Hide on mobile ── */
  @media (max-width: 1024px) {
    .cc-links { display: none; }
    .cc-auth  { display: none; }
    .cc-nav   { padding: 0 18px; }
  }
`;