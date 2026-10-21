import type { Metadata } from "next";
import Link from "next/link";
import { Church, MapPin, Phone, Mail, ChevronLeft, FileText, Send, KeyRound } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/PublicChrome";

export const metadata: Metadata = {
  title: "Contact the Chancery | ADP Clergy Profile System",
  description: "Contact the ADP Chancery Secretariat, Metropolitan Chancery Office, Archdiocese of Bamenda.",
};

const ADDRESS = "Mankon, P.O. Box 82, Bamenda";
const PHONE = "+237 670 000 111";
const EMAIL = "chancery@bamenda-archdiocese.org";

const channels = [
  { icon: Phone, label: "Call", value: PHONE, href: `tel:${PHONE.replace(/\s/g, "")}`, action: "Call the office" },
  { icon: Mail, label: "Email", value: EMAIL, href: `mailto:${EMAIL}`, action: "Send an email" },
  { icon: MapPin, label: "Visit", value: ADDRESS, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS + ", Cameroon")}`, action: "Open in Maps" },
];

const topics = [
  { icon: FileText, title: "Clergy records", desc: "Corrections or questions about a priest's dossier, assignments or status." },
  { icon: Send, title: "Invitations", desc: "Requesting or re-sending an invitation to complete the questionnaire." },
  { icon: KeyRound, title: "System access", desc: "Trouble signing in, account approval, or administrator access." },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-cream via-white to-white">
          <div className="h-1 bg-gradient-to-r from-burgundy via-gold to-burgundy" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 sm:pb-14 text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-stone-warm hover:text-burgundy mb-6 sm:mb-8">
              <ChevronLeft size={15} /> Back to home
            </Link>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-burgundy flex items-center justify-center text-gold-light mx-auto mb-4 sm:mb-5 shadow-lg shadow-burgundy/20">
              <Church size={26} className="sm:w-[30px] sm:h-[30px]" />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-gold uppercase tracking-widest mb-2 sm:mb-3">Contact Us</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">Metropolitan Chancery Office</h1>
            <p className="text-sm sm:text-base text-stone-warm mt-3 max-w-lg mx-auto">
              For inquiries regarding clergy records, invitations, or system access, contact the ADP Chancery Secretariat.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {channels.map(({ icon: Icon, label, value, href, action }) => (
              <a
                key={label}
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="card card-shadow p-5 sm:p-6 text-left group hover:border-gold/30 transition-all"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-burgundy/8 flex items-center justify-center text-burgundy mb-3 sm:mb-4 group-hover:bg-burgundy group-hover:text-gold-light transition-colors">
                  <Icon size={20} />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-gold uppercase tracking-widest mb-1">{label}</p>
                <p className="font-semibold text-sm sm:text-base text-ink break-words">{value}</p>
                <p className="text-xs sm:text-sm font-medium text-burgundy mt-3">{action} →</p>
              </a>
            ))}
          </div>
        </section>

        <section className="bg-cream/50 border-y border-sand/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h2 className="text-lg sm:text-xl font-bold text-ink text-center mb-6 sm:mb-8">We can help with</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {topics.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 text-left">
                  <Icon size={20} className="text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-ink">{title}</p>
                    <p className="text-xs sm:text-sm text-stone-warm leading-relaxed mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
