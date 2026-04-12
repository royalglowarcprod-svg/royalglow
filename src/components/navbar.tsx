"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import style from "../styles/navBar.module.css";
import FloatingCart from "./floatingCart";
import HamburgerMenu from "./hamburgerMenu";

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com", "halayjan18@gmail.com"];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
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

        {/* Desktop Nav Links — center */}
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
                    <img src={user.user_metadata.avatar_url} alt="" className="cc-avatar__img" />
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
                    <div className="cc-dropdown__divider" />
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
                    <div className="cc-dropdown__divider" />
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

        {/* Hamburger — always last, uses your CSS module */}
        <button
          className={`${style.hamburger} ${menuOpen ? style.active : ""}`}
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span/><span/><span/>
        </button>
      </nav>

      {menuOpen && <div className={style.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <HamburgerMenu isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
      <FloatingCart />
    </>
  );
}