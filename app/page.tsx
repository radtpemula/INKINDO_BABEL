import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatisticsSection from "@/components/StatisticsSection";
import MembershipSteps from "@/components/MembershipSteps";
import AboutSection from "@/components/AboutSection";
import RenewalSteps from "@/components/RenewalSteps";
import Partners from "@/components/Partners";
import NewsSection from "@/components/NewsSection";
import SbuRegistration from "@/components/SbuRegistration";
import MemberWorks from "@/components/MemberWorks";
import Footer from "@/components/Footer";
import { mainPartners, additionalPartners } from "@/data/landing";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <Hero />
        <StatisticsSection />
        <MembershipSteps />
        <AboutSection />
        <RenewalSteps />
        <Partners
          id="partners"
          title="Mitra Strategis & Afiliasi Industri"
          subtitle="KEMITRAAN NASIONAL"
          partners={mainPartners}
          bgColor="gray"
        />
        <NewsSection />
        <SbuRegistration />
        <MemberWorks />
        <Partners
          id="additional-partners"
          title="Mitra Lembaga Sertifikasi & Asosiasi Profesi"
          subtitle="JARINGAN KERJASAMA"
          partners={additionalPartners}
          bgColor="gray"
        />
      </main>
      <Footer />
    </div>
  );
}
