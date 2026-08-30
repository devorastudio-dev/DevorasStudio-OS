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
    {
      url: "https://devorastudio.com.br/servicos",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://devorastudio.com.br/produtos",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://devorastudio.com.br/projetos",
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
