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
  paddingClass = "py-20 sm:py-24",
  ctaText,
  ctaHref,
}: ProcessStepsSectionProps) {
  return (
    <section id={id} className={`w-full ${paddingClass} border-b border-gray-100 ${backgroundClass}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#24735A] font-bold block mb-2">
            {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#153448] tracking-tight">
            {title}
          </h2>
          <div className="w-12 h-1 bg-[#D6A84F] mx-auto mt-4 mb-4 rounded-full" />
          <p className="text-sm text-[#52606D] leading-relaxed">
            {description}
          </p>
        </div>

        {/* 4 Process Step Circles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 justify-items-center">
          {steps.map((step, idx) => {
            const Icon = iconMap[step.iconName] || Award;
            const isGreen = idx % 2 === 0;
            const circleBg = isGreen ? "bg-[#24735A]" : "bg-[#153448]";

            return (
              <div key={step.number} className="flex flex-col items-center text-center group w-full max-w-[250px]">
                {/* 180px Circle */}
                <div className="mb-6">
                  <div
                    className={`w-[170px] h-[170px] sm:w-[180px] sm:h-[180px] rounded-full ${circleBg} text-white flex flex-col items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 border-4 border-white`}
                  >
                    <Icon className="w-12 h-12 text-white mb-2" strokeWidth={1.75} aria-hidden="true" />
                    <span className="text-[11px] font-bold tracking-widest uppercase opacity-95 text-[#D6A84F]">
                      Langkah {step.number}
                    </span>
                  </div>
                </div>

                {/* Step Title & Details */}
                <div className="w-full">
                  <h3 className="text-base font-bold text-[#153448] mb-1.5 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#52606D] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Section CTA */}
        {ctaText && ctaHref && (
          <div className="mt-14 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#153448] hover:text-[#24735A] transition group"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 text-[#24735A] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
