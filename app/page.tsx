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
import { getActiveHeroSlides, getHeroSettings } from "@/lib/public/hero";
import { getPublicLatestNews } from "@/lib/public/news";
import { getSiteSettings } from "@/lib/public/settings";
import { getPublicPartnersForHome } from "@/lib/public/partner";
import { getFeaturedMemberWorksForHome } from "@/lib/public/member-work";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    heroSlides,
    heroSettings,
    latestNews,
    siteSettings,
    partners,
    featuredWorks,
  ] = await Promise.all([
    getActiveHeroSlides(),
    getHeroSettings(),
    getPublicLatestNews(6),
    getSiteSettings(),
    getPublicPartnersForHome(),
    getFeaturedMemberWorksForHome(4),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header settings={siteSettings} />
      <main className="flex-grow">
        <Hero slides={heroSlides} settings={heroSettings} />
        <StatisticsSection />
        <MembershipSteps />
        <AboutSection />
        <RenewalSteps />
        <NewsSection initialArticles={latestNews} />
        <SbuRegistration />
        <MemberWorks initialWorks={featuredWorks} />
        <Partners
          id="partners"
          title="Mitra Strategis & Afiliasi Industri"
          subtitle="JARINGAN KEMITRAAN"
          partners={partners}
          bgColor="gray"
        />
      </main>
      <Footer settings={siteSettings} />
    </div>
  );
}
