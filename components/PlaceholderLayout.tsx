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
        {/* Banner header section */}
        <section className="bg-gradient-to-r from-[#153448] to-[#1e4a64] text-white py-12 sm:py-16 border-b border-[#24735A]/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-300">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Beranda
                  </Link>
                </li>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#D6A84F]" aria-hidden="true" />
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

            {category && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#24735A]/60 text-[#D6A84F] border border-[#D6A84F]/30 mb-3">
                {category}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
          </div>
        </section>

        {/* Content body */}
        <section className="py-12 sm:py-16 bg-[#F6F8F7]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200/80 shadow-xs">
              <h2 className="text-xl sm:text-2xl font-bold text-[#153448] mb-4">
                Halaman {title}
              </h2>
              <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-2xl">
                {description}
              </p>

              {children}

              <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#153448] hover:text-[#24735A] transition-colors focus:outline-hidden focus-visible:underline"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Kembali ke Beranda</span>
                </Link>

                <span className="text-xs text-gray-400">
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
