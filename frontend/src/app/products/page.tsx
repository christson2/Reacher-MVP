/**
 * /products - Products Listing Page
 */

import { ProductsPage } from '@/src/modules/products/pages/products';

export default function Page() {
  return <ProductsPage />;
}

export const metadata = {
  title: 'Marketplace - Reacher',
  description: 'Browse and buy products from local sellers',
};
