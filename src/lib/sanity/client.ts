import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

// client safe config
export const config = {
  projectId: "br1oshuv",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
};

export const client = createClient(config);

// Admin client (for mutations)
const adminConfig = {
  ...config,
  token: process.env.SANITY_API_TOKEN,
};

export const adminClient = createClient(adminConfig);

// Image URL builder — must pass client, not config
const builder = createImageUrlBuilder(client);

export const urlFor = (source: any) => builder.image(source);