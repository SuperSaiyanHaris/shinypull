import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

/**
 * Get a product by slug (for rendering in blog posts)
 */
export async function getProduct(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    logger.error('Error fetching product:', error);
    return null;
  }

  return data;
}

/**
 * Get all active products (for public pages like /gear)
 */
export async function getActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    logger.error('Error fetching active products:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all products (for admin)
 */
export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching products:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new product
 */
export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    logger.error('Error creating product:', error);
    throw error;
  }

  return data;
}

/**
 * Update a product
 */
export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating product:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting product:', error);
    throw error;
  }

  return true;
}

/**
 * Toggle product active status
 */
export async function toggleProductActive(id, isActive) {
  return updateProduct(id, { is_active: isActive });
}

/**
 * Generate slug from name
 */
export function generateProductSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
