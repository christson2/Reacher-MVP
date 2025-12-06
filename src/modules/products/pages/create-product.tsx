/**
 * Create Product Page
 * Form for sellers to create new products
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '../../components/ProductForm';
import { createProduct } from '../../services/product-api';
import { useAuthStore } from '@/src/store/authStore';

export default function CreateProductPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication
  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            Please log in to create and sell products.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await createProduct(data);
      if (response.success) {
        router.push(`/products/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Product</h1>
          <p className="text-gray-600">
            Fill in the details below to list your product for sale
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        {/* Tips Section */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 Seller Tips</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Use clear, descriptive titles (avoid ALL CAPS)</li>
              <li>✓ Add a detailed description with features and condition</li>
              <li>✓ Set a competitive price based on market research</li>
              <li>✓ Include accurate location information</li>
              <li>✓ Add high-quality photos for better visibility</li>
              <li>✓ Respond quickly to buyer inquiries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
