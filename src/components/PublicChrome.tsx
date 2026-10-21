import Link from "next/link";
import { ShieldCheck, Cross, Menu, X, Mail, BookOpen } from "lucide-react";

// Header and footer shared by the public pages (home and contact)

export function PublicHeader() {
  return (
    <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-sand/60 bg-white/90 backdrop-blur sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-burgundy flex items-center justify-center text-gold-light shadow-md shrink-0">
          <Cross size={18} className="sm:w-[22px] sm:h-[22px]" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm sm:text-base tracking-tight text-burgundy truncate">ADP System</p>
          <p className="text-[10px] sm:text-[11px] text-stone-warm font-medium truncate">Archdiocese of Bamenda</p>
        </div>
      </Link>
      {/* Wider screens: every link in a row */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <Link href="/contact" className="text-sm font-medium text-stone-warm hover:text-burgundy px-2 py-2">
          Contact
        </Link>
        <Link href="/clergy-login" className="btn-secondary text-sm px-4 py-2" title="Administrator sign in">
          <ShieldCheck size={15} /> Admin
        </Link>
        <Link href="/register" className="btn-secondary text-sm px-4 py-2">Register</Link>
        <Link href="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
      </div>

      {/* Phones: Sign In stays visible, the other links go in a menu */}
      <div className="flex sm:hidden items-center gap-2 shrink-0">
        <Link href="/login" className="btn-primary text-xs px-3 py-1.5">Sign In</Link>
        <details className="relative group">
          <summary
            aria-label="Menu"
            className="list-none [&::-webkit-details-marker]:hidden w-9 h-9 rounded-lg border border-sand flex items-center justify-center text-burgundy cursor-pointer bg-white"
          >
            <Menu size={18} className="group-open:hidden" />
            <X size={18} className="hidden group-open:block" />
          </summary>
          <nav className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-sand/60 bg-white shadow-lg py-2 text-sm">
            <Link href="/contact" className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-cream">
              <Mail size={15} className="text-gold" /> Contact
            </Link>
            <Link href="/register" className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-cream">
              <BookOpen size={15} className="text-gold" /> Register
            </Link>
            <Link href="/clergy-login" className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-cream">
              <ShieldCheck size={15} className="text-gold" /> Admin sign in
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-burgundy text-cream/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <Cross size={14} className="sm:w-[16px] sm:h-[16px] text-gold" />
          <span className="text-gold font-serif italic text-xs sm:text-sm">In Caritate et Veritate</span>
          <Cross size={14} className="sm:w-[16px] sm:h-[16px] text-gold" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-cream">Association of Diocesan Priests · Metropolitan See of Bamenda</p>
        <p className="text-xs sm:text-sm mt-2">
          <Link href="/contact" className="text-gold-light hover:underline">Contact the Chancery</Link>
        </p>
        <p className="text-[10px] sm:text-xs text-cream/50 mt-1.5 sm:mt-2">
          &copy; {new Date().getFullYear()} ADP Profile System. Sacred &amp; Confidential Ecclesiastical Records.
        </p>
      </div>
    </footer>
  );
}
