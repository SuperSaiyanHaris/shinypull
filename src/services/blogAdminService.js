import { supabase } from '../lib/supabase';
import { withErrorHandling } from '../lib/errorHandler';

/**
 * Get all blog posts (including unpublished) for admin
 */
export const getAllPostsAdmin = withErrorHandling(
  async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  'blogAdminService.getAllPostsAdmin'
);

/**
 * Get a single post by ID for editing
 */
export const getPostById = withErrorHandling(
  async (id) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
  'blogAdminService.getPostById'
);

/**
 * Create a new blog post
 */
export const createPost = withErrorHandling(
  async (post) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  'blogAdminService.createPost'
);

/**
 * Update an existing blog post
 */
export const updatePost = withErrorHandling(
  async (id, updates) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  'blogAdminService.updatePost'
);

/**
 * Delete a blog post
 */
export const deletePost = withErrorHandling(
  async (id) => {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
  'blogAdminService.deletePost'
);

/**
 * Toggle publish status
 */
export const togglePublish = withErrorHandling(
  async (id, isPublished) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ is_published: isPublished })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  'blogAdminService.togglePublish'
);

/**
 * Generate slug from title
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
