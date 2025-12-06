/**
 * Product Detail Page
 * Displays a single product with full details
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDetail } from '../../components/ProductDetail';
import { getProductById, deleteProduct } from '../../services/product-api';
import { useAuthStore } from '@/src/store/authStore';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getProductById(productId);
      if (response.success) {
        setProduct(response.data);
      } else {
        setError('Product not found');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/products/${productId}/edit`);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteProduct(productId);
      if (response.success) {
        router.push('/products');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to delete product');
    }
  };

  const handleContactSeller = () => {
    // TODO: Implement messaging/contact feature
    alert('Contact seller feature coming soon');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back
        </button>

        {/* Product Detail */}
        <ProductDetail
          product={product}
          onContactSeller={handleContactSeller}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
}
