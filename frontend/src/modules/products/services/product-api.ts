/**
 * Product Service API
 * Functions for interacting with the Product API
 */

import axios from 'axios';

const API_BASE_URL = '/api/products';

/**
 * List/search products with filtering
 */
export async function getProducts(params: {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'created_at' | 'price' | 'rating';
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}`, { params });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, error: 'Failed to fetch products' };
  }
}

/**
 * Get product detail by ID
 */
export async function getProductById(id: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, error: 'Failed to fetch product' };
  }
}

/**
 * Create new product (seller only)
 */
export async function createProduct(data: {
  title: string;
  description?: string;
  category: string;
  price: number;
  quantity?: number;
  currency?: string;
  location?: string;
  images?: string;
}) {
  try {
    const response = await axios.post(`${API_BASE_URL}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, error: 'Failed to create product' };
  }
}

/**
 * Update product (seller only)
 */
export async function updateProduct(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    quantity?: number;
    location?: string;
  }
) {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, error: 'Failed to update product' };
  }
}

/**
 * Delete product (seller only)
 */
export async function deleteProduct(id: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, error: 'Failed to delete product' };
  }
}
