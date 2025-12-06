/**
 * /products/[id] - Product Detail Page
 */

import ProductDetailPage from '@/src/modules/products/pages/product-detail';

export default function Page() {
  return <ProductDetailPage />;
}

export const metadata = {
  title: 'Product Details - Reacher',
  description: 'View product details and contact seller',
};
