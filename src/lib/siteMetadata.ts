import type { Metadata } from "next";

export const SITE_URL = "https://www.kormanyvalto.com";
export const SOCIAL_IMAGE_URL = "/social-share-2026.png?v=2026-03-13-2";

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
};

export function buildPageMetadata({ title, description, path = "/" }: MetadataInput): Metadata {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${normalizedPath}`;
  const absoluteSocialImageUrl = `${SITE_URL}${SOCIAL_IMAGE_URL}`;

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
