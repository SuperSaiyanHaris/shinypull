import { supabase } from '../lib/supabase';

/**
 * Get all published blog posts, sorted by date (newest first)
 */
export async function getAllPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, category, author, image, read_time, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }

  return data;
}

/**
 * Get a single post by its slug (includes full content)
 */
export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }

  return data;
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, category, author, image, read_time, published_at')
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts by category:', error);
    return [];
  }

  return data;
}

/**
 * Get all unique categories from published posts
 */
export async function getAllCategories() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Extract unique categories
  const categories = [...new Set(data.map(post => post.category).filter(Boolean))];
  return categories;
}

/**
 * Get related posts (same category, excluding current post)
 */
export async function getRelatedPosts(category, excludeSlug, limit = 2) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, category, image, read_time, published_at')
    .eq('is_published', true)
    .eq('category', category)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }

  return data;
}
