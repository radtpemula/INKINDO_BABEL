"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Calendar, Award, CheckCircle2 } from "lucide-react";
import { statisticsData, StatisticItem } from "@/data/landing";

const iconMap = {
  Building2,
  Calendar,
  Award,
  CheckCircle2,
};

function StatCard({ item, isVisible }: { item: StatisticItem; isVisible: boolean }) {
  const [currentValue, setCurrentValue] = useState(0);
  const Icon = iconMap[item.iconName] || Building2;

  useEffect(() => {
    if (!isVisible) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      const timeoutId = setTimeout(() => {
        setCurrentValue(item.value);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const duration = 1600; // ms
    const frames = 40;
    const stepTime = duration / frames;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      // easeOutExpo function for smooth number slowdown
      const progress = 1 - Math.pow(2, -10 * (currentStep / frames));
      const nextVal = Math.min(item.value, Math.round(progress * item.value));
      setCurrentValue(nextVal);

      if (currentStep >= frames) {
        setCurrentValue(item.value);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, item.value]);

  return (
    <div className="group relative bg-white rounded-lg p-5 sm:p-6 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      {/* Top subtle highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E293B] rounded-t-lg group-hover:bg-[#D97706] transition-colors" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#1E293B] shrink-0 group-hover:bg-[#1E293B] group-hover:text-white transition-colors duration-300">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">
          Resmi
        </span>
      </div>

      <div className="flex items-baseline gap-1 text-[#0F172A] mb-1.5">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums font-mono">
          {currentValue}
        </span>
        <span className="text-xl sm:text-2xl font-bold text-[#D97706]">
          {item.suffix}
        </span>
      </div>

      <h3 className="text-sm font-bold text-[#1E293B] leading-snug mb-1">
        {item.label}
      </h3>
      <p className="text-xs text-[#64748B] leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

export default function StatisticsSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.2,
      }
    );

    const currentElem = sectionRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      id="statistics"
      className="relative z-10 w-full bg-[#F8FAFC] py-8 sm:py-12 border-b border-[#E2E8F0]"
      aria-label="Statistik Utama INKINDO BABEL"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statisticsData.map((item) => (
            <StatCard key={item.id} item={item} isVisible={hasAnimated} />
          ))}
        </div>
      </div>
    </section>
  );
}
