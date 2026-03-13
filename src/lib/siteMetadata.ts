import type { Metadata } from "next";

export const SITE_URL = "https://www.kormanyvalto.com";
export const SOCIAL_IMAGE_URL = "/social-share-2026.png?v=2026-03-13-2";
export const DASHBOARD_SOCIAL_IMAGE_URL = "/social-share-dashboard-2026.png?v=2026-03-13-1";

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  socialImagePath?: string;
};

export function buildPageMetadata({ title, description, path = "/", socialImagePath = SOCIAL_IMAGE_URL }: MetadataInput): Metadata {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${normalizedPath}`;
  const normalizedSocialImagePath = socialImagePath.startsWith("/") ? socialImagePath : `/${socialImagePath}`;
  const absoluteSocialImageUrl = `${SITE_URL}${normalizedSocialImagePath}`;

  return {
    title,
    description,
    alternates: {
      canonical: normalizedPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: [
        {
          url: absoluteSocialImageUrl,
          secureUrl: absoluteSocialImageUrl,
          width: 1536,
          height: 1024,
          alt: "Szavazás 2026",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteSocialImageUrl],
    },
  };
}
