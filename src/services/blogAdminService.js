import { supabase } from '../lib/supabase';

/**
 * Get all blog posts (including unpublished) for admin
 */
export async function getAllPostsAdmin() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }

  return data;
}

/**
 * Get a single post by ID for editing
 */
export async function getPostById(id) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new blog post
 */
export async function createPost(post) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing blog post
 */
export async function updatePost(id, updates) {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a blog post
 */
export async function deletePost(id) {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }

  return true;
}

/**
 * Toggle publish status
 */
export async function togglePublish(id, isPublished) {
  return updatePost(id, { is_published: isPublished });
}

/**
 * Generate slug from title
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
