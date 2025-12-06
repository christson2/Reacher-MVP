/**
 * ProductDetail Component
 * Organism: Display full product details with actions
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import Link from 'next/link';

interface ProductDetailProps {
  product: any;
  onContactSeller?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  currentUserId?: string;
  isLoading?: boolean;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onContactSeller,
  onEdit,
  onDelete,
  currentUserId,
  isLoading = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId === product.seller_id;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setIsDeleting(true);
      try {
        await onDelete?.();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Image Gallery */}
      <div className="mb-8">
        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-600">No Image</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2">
          {/* Category & Title */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-2">
              {product.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex text-yellow-400 text-2xl">
              {'★'.repeat(Math.floor(product.rating || 0))}
              {'☆'.repeat(5 - Math.floor(product.rating || 0))}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {product.rating || 0} out of 5
              </div>
              <div className="text-gray-600 text-sm">
                {product.reviews_count || 0} reviews
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description || 'No description provided'}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {product.location && (
              <div>
                <div className="text-gray-600 text-sm font-medium">Location</div>
                <div className="text-gray-900 font-semibold">📍 {product.location}</div>
              </div>
            )}
            {product.quantity !== undefined && (
              <div>
                <div className="text-gray-600 text-sm font-medium">Stock</div>
                <div className="text-gray-900 font-semibold">
                  {product.quantity} available
                </div>
              </div>
            )}
            {product.currency && (
              <div>
                <div className="text-gray-600 text-sm font-medium">Currency</div>
                <div className="text-gray-900 font-semibold">{product.currency}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            {/* Price */}
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-1">Price</div>
              <div className="text-4xl font-bold text-gray-900">
                {product.currency || 'USD'} {product.price.toFixed(2)}
              </div>
            </div>

            {/* Seller Info */}
            {product.seller_id && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="text-gray-600 text-sm font-medium mb-2">Seller</div>
                <Link
                  href={`/users/${product.seller_id}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  View Profile →
                </Link>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isOwner ? (
                <>
                  <Button
                    onClick={onEdit}
                    variant="primary"
                    className="w-full"
                  >
                    Edit Product
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Product'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={onContactSeller}
                    variant="primary"
                    className="w-full"
                  >
                    Contact Seller
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                  >
                    Add to Favorites ♡
                  </Button>
                </>
              )}
            </div>

            {/* Posted Date */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
              Posted {new Date(product.created_at).toLocaleDateString()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
