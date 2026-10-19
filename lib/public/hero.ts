import { prisma } from "@/lib/prisma";

export interface PublicHeroSlide {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  linkUrl: string | null;
  linkLabel: string | null;
  order: number;
}

export interface HeroCardSettings {
  cardTitle: string;
  cardSubtitle: string;
  cardBadge: string;
  cardFallbackTag: string;
  cardFeature1Title: string;
  cardFeature1Desc: string;
  cardFeature2Title: string;
  cardFeature2Desc: string;
  highlight1Text: string;
  highlight2Text: string;
  highlight3Text: string;
  cardImagePath: string;
}

export interface PublicHeroSettings {
  background: {
    backgroundImagePath: string; // "" berarti default blueprint background
  };
  content: {
    badge: string;
    titlePrefix: string;
    titleAccent: string;
    description: string;
    primaryCtaText: string;
    primaryCtaHref: string;
    secondaryCtaText: string;
    secondaryCtaHref: string;
    subBannerText: string;
    subBannerCtaText: string;
    subBannerCtaHref: string;
  };
  cards: HeroCardSettings;
}

export const DEFAULT_HERO_SETTINGS: PublicHeroSettings = {
  background: {
    backgroundImagePath: "",
  },
  content: {
    badge: "Ikatan Nasional Konsultan Indonesia",
    titlePrefix: "DPP INKINDO",
    titleAccent: "BABEL",
    description:
      "Wadah Perusahaan Jasa Konsultansi Profesional, Berintegritas, dan Berdaya Saing Unggul di Provinsi Kepulauan Bangka Belitung.",
    primaryCtaText: "Daftar Anggota Baru",
    primaryCtaHref: "#membership-steps",
    secondaryCtaText: "Layanan SBU Online",
    secondaryCtaHref: "#sbu-steps",
    subBannerText:
      "Menjadi Mitra Strategis Pemerintah dan Masyarakat dalam Pembangunan",
    subBannerCtaText: "Daftar Sekarang",
    subBannerCtaHref: "#membership-steps",
  },
  cards: {
    cardTitle: "Rekayasa & Desain Konsultansi",
    cardSubtitle: "Wilayah Kepulauan Bangka Belitung",
    cardBadge: "SERUMPUN SEBALAI",
    cardFallbackTag: "STRUKTUR MARITIM & SIPIL",
    cardFeature1Title: "Terakreditasi",
    cardFeature1Desc: "Standar Asosiasi Konsultan Nasional",
    cardFeature2Title: "Multi Disiplin",
    cardFeature2Desc: "Konstruksi, Maritim, & Lingkungan",
    highlight1Text: "Asosiasi Resmi Terdaftar",
    highlight2Text: "Sertifikasi Standar LPJK",
    highlight3Text: "120+ Konsultan Babel",
    cardImagePath: "",
  },
};

export async function getActiveHeroSlides(): Promise<PublicHeroSlide[]> {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        imagePath: true,
        imageAlt: true,
        linkUrl: true,
        linkLabel: true,
        order: true,
      },
    });

    return slides;
  } catch {
    return [];
  }
}

export async function getHeroSettings(): Promise<PublicHeroSettings> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { group: "hero" },
    });

    const map = new Map<string, string>();
    for (const s of settings) {
      map.set(s.key, s.value);
    }

    return {
      background: {
        backgroundImagePath:
          map.get("hero_bg_image") ?? DEFAULT_HERO_SETTINGS.background.backgroundImagePath,
      },
      content: {
        badge: map.get("hero_badge") ?? DEFAULT_HERO_SETTINGS.content.badge,
        titlePrefix:
          map.get("hero_title_prefix") ?? DEFAULT_HERO_SETTINGS.content.titlePrefix,
        titleAccent:
          map.get("hero_title_accent") ?? DEFAULT_HERO_SETTINGS.content.titleAccent,
        description:
          map.get("hero_description") ?? DEFAULT_HERO_SETTINGS.content.description,
        primaryCtaText:
          map.get("hero_cta1_text") ?? DEFAULT_HERO_SETTINGS.content.primaryCtaText,
        primaryCtaHref:
          map.get("hero_cta1_url") ?? DEFAULT_HERO_SETTINGS.content.primaryCtaHref,
        secondaryCtaText:
          map.get("hero_cta2_text") ?? DEFAULT_HERO_SETTINGS.content.secondaryCtaText,
        secondaryCtaHref:
          map.get("hero_cta2_url") ?? DEFAULT_HERO_SETTINGS.content.secondaryCtaHref,
        subBannerText:
          map.get("hero_subbanner_text") ?? DEFAULT_HERO_SETTINGS.content.subBannerText,
        subBannerCtaText:
          map.get("hero_subbanner_cta_text") ??
          DEFAULT_HERO_SETTINGS.content.subBannerCtaText,
        subBannerCtaHref:
          map.get("hero_subbanner_cta_url") ??
          DEFAULT_HERO_SETTINGS.content.subBannerCtaHref,
      },
      cards: {
        cardTitle: map.get("hero_card_title") ?? DEFAULT_HERO_SETTINGS.cards.cardTitle,
        cardSubtitle: map.get("hero_card_subtitle") ?? DEFAULT_HERO_SETTINGS.cards.cardSubtitle,
        cardBadge: map.get("hero_card_badge") ?? DEFAULT_HERO_SETTINGS.cards.cardBadge,
        cardFallbackTag:
          map.get("hero_card_fallback_tag") ?? DEFAULT_HERO_SETTINGS.cards.cardFallbackTag,
        cardFeature1Title:
          map.get("hero_card_feature1_title") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature1Title,
        cardFeature1Desc:
          map.get("hero_card_feature1_desc") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature1Desc,
        cardFeature2Title:
          map.get("hero_card_feature2_title") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature2Title,
        cardFeature2Desc:
          map.get("hero_card_feature2_desc") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature2Desc,
        highlight1Text:
          map.get("hero_highlight1_text") ?? DEFAULT_HERO_SETTINGS.cards.highlight1Text,
        highlight2Text:
          map.get("hero_highlight2_text") ?? DEFAULT_HERO_SETTINGS.cards.highlight2Text,
        highlight3Text:
          map.get("hero_highlight3_text") ?? DEFAULT_HERO_SETTINGS.cards.highlight3Text,
        cardImagePath:
          map.get("hero_card_image") ?? DEFAULT_HERO_SETTINGS.cards.cardImagePath,
      },
    };
  } catch {
    return DEFAULT_HERO_SETTINGS;
  }
}
