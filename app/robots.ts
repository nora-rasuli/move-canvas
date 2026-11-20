import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/coach", "/coach/dance", "/coach/tennis"],
      disallow: ["/api/", "/calibrate", "/pair", "/display/", "/coach/controller"],
    },
  };
}
