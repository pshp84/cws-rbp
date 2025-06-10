export enum ProductType {
  Simple = "simple",
  Variable = "variable",
  Variation = "variation",
}

export enum productStatus {
  Draft = "draft",
  Publish = "publish",
  Trash = "trash",
}

export enum productStockStatus {
  inStock = "In stock",
  outOfStock = "Out of stock",
}

export interface hvacFilterProductInterface {
  name: string;
  slug: string;
  productType: ProductType;
  description?: string;
  productParent?: number;
  productStatus?: productStatus;
  price?: number;
  stockStatus?: productStockStatus;
  isSubscription?: boolean;
}
