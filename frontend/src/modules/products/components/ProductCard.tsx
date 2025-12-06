/**
 * ProductCard Component
 * Atom: Displays a product in card format
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';

interface ProductCardProps {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  location?: string;
  rating?: number;
  reviews_count?: number;
  image_url?: string;
  seller_id: string;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  description,
  price,
  currency = 'USD',
  category,
  location,
  rating = 0,
  reviews_count = 0,
  image_url,
  seller_id,
  onClick,
}) => {
  return (
    <Link href={`/products/${id}`}>
      <Card className="product-card hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Image */}
        <div className="aspect-square bg-gray-200 rounded-t-lg overflow-hidden flex items-center justify-center">
          {image_url ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-600 text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Category */}
          <span className="inline-block w-fit px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold mb-2">
            {category}
          </span>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Location */}
          {location && (
            <p className="text-gray-500 text-xs mb-3">
              📍 {location}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(rating))}
              {'☆'.repeat(5 - Math.floor(rating))}
            </div>
            <span className="text-gray-600 text-xs">
              {rating.toFixed(1)} ({reviews_count} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto pt-3 border-t border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {currency} {price.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
