import Link from "next/link";
import {
  UserPlus,
  FileCheck,
  CreditCard,
  Award,
  LogIn,
  Edit3,
  Receipt,
  CheckCircle,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { StepItem } from "@/data/landing";

const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  FileCheck,
  CreditCard,
  Award,
  LogIn,
  Edit3,
  Receipt,
  CheckCircle,
  ShieldCheck,
  FileSpreadsheet,
};

interface ProcessStepsSectionProps {
  id: string;
  badge: string;
  title: string;
  description: string;
  steps: StepItem[];
  backgroundClass?: string;
  paddingClass?: string;
  ctaText?: string;
  ctaHref?: string;
}

export default function ProcessStepsSection({
  id,
  badge,
  title,
  description,
  steps,
  backgroundClass = "bg-white",
  paddingClass = "py-20 sm:py-24 xl:py-28",
  ctaText,
  ctaHref,
}: ProcessStepsSectionProps) {
  return (
    <section id={id} className={`w-full ${paddingClass} border-b border-[#E2E8F0] ${backgroundClass}`}>
      <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs sm:text-[13px] uppercase tracking-widest text-[#D97706] font-bold block mb-2.5">
            {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-[#0F172A] tracking-tight">
            {title}
          </h2>
          <div className="w-14 h-1 bg-[#D97706] mx-auto mt-4 mb-4 rounded-full" />
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            {description}
          </p>
        </div>

        {/* 4 Process Step Circles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 xl:gap-10 justify-items-center">
          {steps.map((step, idx) => {
            const Icon = iconMap[step.iconName] || Award;
            const isAmberTheme = idx % 2 === 1; // Step 2 & 4 have subtle Burnt Amber accent rhythm

            const circleBg = isAmberTheme ? "bg-[#1E293B]" : "bg-[#0F172A]";
            const iconColor = isAmberTheme ? "text-[#D97706]" : "text-white";
            const badgeBg = isAmberTheme ? "bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30" : "bg-white/10 text-slate-200 border border-white/10";
            const outerRing = isAmberTheme ? "border-[#E2E8F0] group-hover:border-[#D97706]/50" : "border-[#E2E8F0] group-hover:border-slate-400";

            return (
              <div key={step.number} className="flex flex-col items-center text-center group w-full max-w-[270px] xl:max-w-[290px]">
                {/* 180-195px Circle */}
                <div className="mb-6 relative">
                  <div
                    className={`w-[175px] h-[175px] sm:w-[185px] sm:h-[185px] xl:w-[195px] xl:h-[195px] rounded-full ${circleBg} flex flex-col items-center justify-center shadow-md transition-all duration-300 group-hover:scale-105 border-4 ${outerRing}`}
                  >
                    <Icon className={`w-12 h-12 xl:w-14 xl:h-14 ${iconColor} mb-2.5 transition-transform duration-300 group-hover:-translate-y-0.5`} strokeWidth={1.75} aria-hidden="true" />
                    <span className={`text-[10px] sm:text-[11px] xl:text-xs font-bold tracking-widest uppercase px-3 py-0.5 rounded-full ${badgeBg}`}>
                      Langkah {step.number}
                    </span>
                  </div>
                </div>

                {/* Step Title & Details */}
                <div className="w-full">
                  <h3 className="text-base xl:text-lg font-bold text-[#0F172A] mb-1.5 leading-snug group-hover:text-[#D97706] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#64748B] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Section CTA */}
        {ctaText && ctaHref && (
          <div className="mt-14 sm:mt-16 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0F172A] hover:text-[#D97706] transition group"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 text-[#D97706] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
