import Link from "next/link";
import { Church, ShieldCheck, Database, CalendarClock, BookOpen, Cross } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/PublicChrome";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      <PublicHeader />

      <main className="flex-1">

        <section className="relative overflow-hidden bg-gradient-to-b from-cream via-white to-white">
          <div className="h-1 bg-gradient-to-r from-burgundy via-gold to-burgundy" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24 text-center">

            <div className="inline-flex mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-burgundy to-burgundy/80 flex items-center justify-center text-gold-light shadow-xl shadow-burgundy/20 border-2 border-gold/30">
                <Church size={34} className="sm:w-[40px] sm:h-[40px] lg:w-[44px] lg:h-[44px]" />
              </div>
            </div>

            <p className="text-xs sm:text-sm lg:text-base font-medium text-gold tracking-[0.2em] sm:tracking-widest uppercase mb-2 sm:mb-3">
              Association of Diocesan Priests
            </p>

            <h1 className="max-w-3xl mx-auto text-3xl sm:text-4xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-ink">
              Official Presbyterate
              <span className="block text-burgundy">Registry &amp; Archives</span>
            </h1>

            <div className="inline-flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gold/10 border border-gold/20">
              <Cross size={12} className="sm:w-[14px] sm:h-[14px] text-gold" />
              <span className="text-gold font-serif italic text-xs sm:text-sm lg:text-base">In Caritate et Veritate</span>
              <Cross size={12} className="sm:w-[14px] sm:h-[14px] text-gold" />
            </div>

            <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-stone-warm mt-4 sm:mt-6 leading-relaxed px-2">
              The centralized digital repository for biographical records, pastoral assignments,
              academic formation, ecclesiastical status, and necrology; serving the priests
              of the Metropolitan See of Bamenda.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 sm:mt-8">
              <Link href="/login" className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto">
                <ShieldCheck size={18} /> Access Clergy Portal
              </Link>
              <Link href="/register" className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto">
                <BookOpen size={18} /> Priest Registration
              </Link>
            </div>

            <p className="mt-5 text-sm sm:text-base text-stone-warm">
              Administrator?{' '}
              <Link href="/clergy-login" className="font-medium text-burgundy hover:underline">Sign in to the Admin Board</Link>
            </p>

          </div>
        </section>


        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs font-bold text-gold uppercase tracking-widest mb-2 sm:mb-3">Platform Capabilities</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink px-2">A Complete Clergy Management Suite</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { icon: BookOpen, title: "Structured Dossiers", desc: "Multi-step questionnaires capturing personal info, ordination, academics, assignments, and ministries." },
              { icon: ShieldCheck, title: "Review & Approval", desc: "Profiles become active only after thorough review and approval by ADP Chancery administrators." },
              { icon: Database, title: "Offline Resilient", desc: "Questionnaire data saves locally and syncs automatically when connectivity is restored." },
              { icon: CalendarClock, title: "Liturgical Calendar", desc: "Track ordination anniversaries, priest birthdays, necrology memorials, and jubilees." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-shadow p-5 sm:p-6 text-left group hover:border-gold/30 transition-all">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-burgundy/8 flex items-center justify-center text-burgundy mb-3 sm:mb-4 group-hover:bg-burgundy group-hover:text-gold-light transition-colors">
                  <Icon size={20} className="sm:w-[21px] sm:h-[21px]" />
                </div>
                <p className="font-semibold text-sm sm:text-base text-ink mb-1.5 sm:mb-2">{title}</p>
                <p className="text-xs sm:text-sm text-stone-warm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <PublicFooter />

    </div>
  );
}