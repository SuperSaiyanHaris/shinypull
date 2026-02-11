import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

/**
 * Get the current session token for authenticated API calls
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return session.access_token;
}

/**
 * Make an authenticated request to the products admin API
 */
async function productsAdminRequest(action, id = null, data = null) {
  const token = await getAuthToken();
  const response = await fetch('/api/products-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, id, data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Products admin request failed');
  }

  return response.json();
}

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
 * Reads still go directly to Supabase (SELECT is always allowed)
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
 * Create a new product (via authenticated API)
 */
export async function createProduct(product) {
  const result = await productsAdminRequest('create', null, product);
  return result.data;
}

/**
 * Update a product (via authenticated API)
 */
export async function updateProduct(id, updates) {
  const result = await productsAdminRequest('update', id, updates);
  return result.data;
}

/**
 * Delete a product (via authenticated API)
 */
export async function deleteProduct(id) {
  await productsAdminRequest('delete', id);
  return true;
}

/**
 * Toggle product active status (via authenticated API)
 */
export async function toggleProductActive(id, isActive) {
  const result = await productsAdminRequest('toggleActive', id, { is_active: isActive });
  return result.data;
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
