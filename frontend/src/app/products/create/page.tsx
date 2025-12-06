/**
 * /products/create - Create Product Page
 */

import CreateProductPage from '@/src/modules/products/pages/create-product';

export default function Page() {
  return <CreateProductPage />;
}

export const metadata = {
  title: 'Create Product - Reacher',
  description: 'List a new product for sale',
};
