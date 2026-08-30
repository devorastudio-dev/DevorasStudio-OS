import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://devorastudio.com.br",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://devorastudio.com.br/privacy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
