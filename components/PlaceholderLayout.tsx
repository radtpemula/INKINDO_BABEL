import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PlaceholderLayoutProps {
  title: string;
  category?: string;
  breadcrumbs: BreadcrumbItem[];
  description?: string;
  children?: React.ReactNode;
}

export default function PlaceholderLayout({
  title,
  category,
  breadcrumbs,
  description = "Konten akan segera tersedia.",
  children,
}: PlaceholderLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        {/* Compact internal page header / section divider */}
        <section className="bg-[#0F172A] text-white py-6 sm:py-8 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-2.5">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Beranda
                  </Link>
                </li>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-white font-medium">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {category && (
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-slate-800 text-[#D97706] border border-slate-700">
                  {category}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white tracking-tight leading-tight">
                {title}
              </h1>
            </div>
          </div>
        </section>

        {/* Content body */}
        <section className="py-12 sm:py-16 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-xl p-8 sm:p-12 border border-[#E2E8F0] shadow-xs">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-4">
                Halaman {title}
              </h2>
              <p className="text-base text-[#64748B] mb-8 leading-relaxed max-w-2xl">
                {description}
              </p>

              {children}

              <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap gap-4 items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#D97706] transition-colors focus:outline-hidden focus-visible:underline"
                >
                  <ArrowLeft className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  <span>Kembali ke Beranda</span>
                </Link>

                <span className="text-xs text-slate-400">
                  DPP INKINDO Provinsi Kepulauan Bangka Belitung
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
