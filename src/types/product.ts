export interface Shop {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  logo_url: string | null;
  cover_url?: string | null;
  description?: string | null;
  location_city: string | null;
  location_url: string | null;
  show_location: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  is_promotion: boolean;
  image_url: string | null;
  shop_id: string;
  created_at: string;
  location_city: string | null;
  location_url: string | null;
  show_location: boolean;
  shops: Shop;
  categories?: {
    name: string;
  } | null;
  subcategories?: {
    name: string;
  } | null;
  category_id?: string | null;
  subcategory_id?: string | null;
}
