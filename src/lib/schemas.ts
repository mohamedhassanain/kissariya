import { z } from "zod";

export const shopSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  description: z.string().max(500).optional(),
  whatsapp_number: z.string().regex(/^\+?\d{10,15}$/, "Numéro WhatsApp invalide"),
  slug: z.string().min(3, "Le lien doit contenir au moins 3 caractères").regex(/^[a-z0-9-]+$/, "Le lien ne doit contenir que des lettres minuscules, chiffres et tirets"),
  logo_url: z.string().url().optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
  location_city: z.string().max(100).optional(),
  location_url: z.string().url().optional().or(z.literal("")),
  show_location: z.boolean().default(true),
});

export const productBaseSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  description: z.string().max(2000).optional(),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  original_price: z.number().positive().optional(),
  is_promotion: z.boolean().default(false),
  category_id: z.string().uuid().optional(),
  subcategory_id: z.string().uuid().optional(),
  image_url: z.string().optional(),
  location_city: z.string().max(100).optional(),
  location_url: z.string().url().optional().or(z.literal("")),
  show_location: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const productSchema = productBaseSchema.refine((data) => {
  if (data.is_promotion && data.original_price) {
    return data.original_price > data.price;
  }
  return true;
}, {
  message: "Le prix original doit être supérieur au prix promotionnel",
  path: ["original_price"],
});

export type ShopInput = z.infer<typeof shopSchema>;
export type ProductInput = z.infer<typeof productSchema>;
