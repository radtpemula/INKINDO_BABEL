import { prisma } from "@/lib/prisma";
import { topBarData, footerData } from "@/data/landing";

export interface SiteIdentitySettings {
  orgName: string;
  tagline: string;
  region: string;
  description: string;
}

export interface SiteContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  fax: string;
}

export interface SiteTopbarSettings {
  phone: string;
  email: string;
  location: string;
  workingHours: string;
}

export interface SiteFooterSettings {
  description: string;
  address: string;
  legal: string;
  copyright: string;
}

export interface SiteSocialSettings {
  instagram: string;
  instagramLabel: string;
  facebook: string;
  facebookLabel: string;
  youtube: string;
  youtubeLabel: string;
  linkedin: string;
  linkedinLabel: string;
}

export interface PublicSiteSettings {
  identity: SiteIdentitySettings;
  contact: SiteContactSettings;
  topbar: SiteTopbarSettings;
  footer: SiteFooterSettings;
  social: SiteSocialSettings;
}

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  identity: {
    orgName: footerData.orgName,
    tagline: footerData.tagline,
    region: "Provinsi Kepulauan Bangka Belitung",
    description: footerData.description,
  },
  contact: {
    phone: footerData.phone,
    email: footerData.email,
    address: footerData.address,
    workingHours: topBarData.workingHours,
    fax: footerData.fax,
  },
  topbar: {
    phone: topBarData.phone,
    email: topBarData.email,
    location: "Pangkalpinang",
    workingHours: topBarData.workingHours,
  },
  footer: {
    description: footerData.description,
    address: footerData.address,
    legal: footerData.legal,
    copyright: footerData.copyright,
  },
  social: {
    instagram: "",
    instagramLabel: "",
    facebook: "",
    facebookLabel: "",
    youtube: "",
    youtubeLabel: "",
    linkedin: "",
    linkedinLabel: "",
  },
};

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        group: {
          in: ["general", "contact", "topbar", "footer", "social"],
        },
      },
    });

    const map = new Map<string, string>();
    for (const s of settings) {
      map.set(s.key, s.value);
    }

    const currentYear = new Date().getFullYear().toString();
    const rawCopyright = map.get("footer_copyright") ?? DEFAULT_SITE_SETTINGS.footer.copyright;
    const resolvedCopyright = rawCopyright.replace(/\{year\}/g, currentYear);

    return {
      identity: {
        orgName: map.get("site_org_name") ?? DEFAULT_SITE_SETTINGS.identity.orgName,
        tagline: map.get("site_tagline") ?? DEFAULT_SITE_SETTINGS.identity.tagline,
        region: map.get("site_region") ?? DEFAULT_SITE_SETTINGS.identity.region,
        description: map.get("site_description") ?? DEFAULT_SITE_SETTINGS.identity.description,
      },
      contact: {
        phone: map.get("contact_phone") ?? DEFAULT_SITE_SETTINGS.contact.phone,
        email: map.get("contact_email") ?? DEFAULT_SITE_SETTINGS.contact.email,
        address: map.get("contact_address") ?? DEFAULT_SITE_SETTINGS.contact.address,
        workingHours: map.get("contact_working_hours") ?? DEFAULT_SITE_SETTINGS.contact.workingHours,
        fax: map.get("contact_fax") ?? DEFAULT_SITE_SETTINGS.contact.fax,
      },
      topbar: {
        phone: map.get("topbar_phone") ?? DEFAULT_SITE_SETTINGS.topbar.phone,
        email: map.get("topbar_email") ?? DEFAULT_SITE_SETTINGS.topbar.email,
        location: map.get("topbar_location") ?? DEFAULT_SITE_SETTINGS.topbar.location,
        workingHours: map.get("topbar_working_hours") ?? DEFAULT_SITE_SETTINGS.topbar.workingHours,
      },
      footer: {
        description: map.get("footer_description") ?? DEFAULT_SITE_SETTINGS.footer.description,
        address: map.get("footer_address") ?? DEFAULT_SITE_SETTINGS.footer.address,
        legal: map.get("footer_legal") ?? DEFAULT_SITE_SETTINGS.footer.legal,
        copyright: resolvedCopyright,
      },
      social: {
        instagram: map.get("social_instagram") ?? DEFAULT_SITE_SETTINGS.social.instagram,
        instagramLabel: map.get("social_instagram_label") ?? DEFAULT_SITE_SETTINGS.social.instagramLabel,
        facebook: map.get("social_facebook") ?? DEFAULT_SITE_SETTINGS.social.facebook,
        facebookLabel: map.get("social_facebook_label") ?? DEFAULT_SITE_SETTINGS.social.facebookLabel,
        youtube: map.get("social_youtube") ?? DEFAULT_SITE_SETTINGS.social.youtube,
        youtubeLabel: map.get("social_youtube_label") ?? DEFAULT_SITE_SETTINGS.social.youtubeLabel,
        linkedin: map.get("social_linkedin") ?? DEFAULT_SITE_SETTINGS.social.linkedin,
        linkedinLabel: map.get("social_linkedin_label") ?? DEFAULT_SITE_SETTINGS.social.linkedinLabel,
      },
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
