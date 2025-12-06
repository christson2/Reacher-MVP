/**
 * SearchBar Component
 * Molecule: Search and filter products
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

interface SearchBarProps {
  onSearch: (filters: {
    search?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
  }) => void;
  categories?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Services'],
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('created_at');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      search: search || undefined,
      category: category || undefined,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined,
      sort,
    });
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('created_at');
    onSearch({});
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white p-6 rounded-lg shadow-md mb-6"
    >
      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Price
          </label>
          <Input
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <Input
            type="number"
            placeholder="$999"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
          >
            <option value="created_at">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-right">
        <button
          type="button"
          onClick={handleReset}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </form>
  );
};
