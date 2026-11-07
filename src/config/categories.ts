/**
 * The categories a visitor can browse by, in the order the home page and the browse filters show
 * them. Kept in sync with the categories a seller can pick when listing an item
 * (SellerCreateListingStep1.tsx); a category with no live auction simply shows nothing.
 */
export const BROWSE_CATEGORIES = [
  'Electronics & Gadgets',
  'Vehicles',
  'Clothing & Fashion',
  'Books & Education',
  'Home & Furniture',
  'Sports & Fitness',
  'Art & Collectibles',
] as const;
