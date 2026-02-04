import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Image,
} from 'lucide-react';
import SEO from '../components/SEO';
import {
  getAllPostsAdmin,
  createPost,
  updatePost,
  deletePost,
  togglePublish,
  generateSlug,
} from '../services/blogAdminService';

const CATEGORIES = ['Streaming Gear', 'Growth Tips', 'Industry Insights', 'Tutorials'];

const emptyPost = {
  title: '',
  slug: '',
  description: '',
  content: '',
  category: 'Streaming Gear',
  author: 'ShinyPull Team',
  image: '',
  read_time: '5 min read',
  is_published: false,
};

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [formData, setFormData] = useState(emptyPost);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setLoading(true);
      const data = await getAllPostsAdmin();
      setPosts(data || []);
    } catch (err) {
      setError('Failed to load posts. Make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(message) {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  }

  function showError(message) {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }

  function handleNewPost() {
    setCurrentPost(null);
    setFormData(emptyPost);
    setIsEditing(true);
  }

  function handleEditPost(post) {
    setCurrentPost(post);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      description: post.description || '',
      content: post.content || '',
      category: post.category || 'Streaming Gear',
      author: post.author || 'ShinyPull Team',
      image: post.image || '',
      read_time: post.read_time || '5 min read',
      is_published: post.is_published || false,
    });
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setCurrentPost(null);
    setFormData(emptyPost);
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-generate slug from title
    if (name === 'title' && !currentPost) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  }

  async function handleSave() {
    if (!formData.title || !formData.slug || !formData.content) {
      showError('Title, slug, and content are required');
      return;
    }

    try {
      setSaving(true);
      if (currentPost) {
        await updatePost(currentPost.id, formData);
        showSuccess('Post updated successfully!');
      } else {
        await createPost({
          ...formData,
          published_at: new Date().toISOString().split('T')[0],
        });
        showSuccess('Post created successfully!');
      }
      await fetchPosts();
      handleCancelEdit();
    } catch (err) {
      showError(err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(post) {
    try {
      await togglePublish(post.id, !post.is_published);
      await fetchPosts();
      showSuccess(post.is_published ? 'Post unpublished' : 'Post published!');
    } catch (err) {
      showError('Failed to update publish status');
    }
  }

  async function handleDelete(id) {
    try {
      await deletePost(id);
      await fetchPosts();
      setDeleteConfirm(null);
      showSuccess('Post deleted');
    } catch (err) {
      showError('Failed to delete post');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Blog Admin" description="Manage blog posts" />

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/blog"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Blog Admin</h1>
                  <p className="text-sm text-gray-500">{posts.length} posts</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={handleNewPost}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {(error || success) && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          {isEditing ? (
            /* Editor View */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentPost ? 'Edit Post' : 'Create New Post'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Title & Slug */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Best Streaming Setup for 2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="best-streaming-setup-2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="A brief description for SEO and previews"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                {/* Category, Author, Read Time */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Read Time
                    </label>
                    <input
                      type="text"
                      name="read_time"
                      value={formData.read_time}
                      onChange={handleInputChange}
                      placeholder="5 min read"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                    />
                    {formData.image && (
                      <a
                        href={formData.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Image className="w-5 h-5 text-gray-600" />
                      </a>
                    )}
                  </div>
                  {formData.image && (
                    <div className="mt-2 w-full max-w-md rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content (Markdown) *
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Supports: # Headers, **bold**, *italic*, - lists, [links](url), and {"{{product:slug}}"} for product cards
                  </div>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={20}
                    placeholder="# Your Article Title

Write your content here using Markdown...

## Section Header

Regular paragraph text with **bold** and *italic* formatting.

- List item 1
- List item 2

{{product:fifine-k669b}}

More content..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* Publish Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_published" className="flex-1">
                    <span className="font-medium text-gray-900">Publish immediately</span>
                    <p className="text-sm text-gray-500">
                      When checked, the post will be visible on the public blog
                    </p>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
                  <button
                    onClick={handleNewPost}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Post
                  </button>
                </div>
              ) : (
                posts.map(post => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {post.image && (
                        <div className="hidden sm:block w-32 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={post.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {post.is_published ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  <Eye className="w-3 h-3" />
                                  Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                  <EyeOff className="w-3 h-3" />
                                  Draft
                                </span>
                              )}
                              <span className="text-xs text-gray-500">{post.category}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">{post.description}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {post.is_published && (
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View post"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                              </a>
                            )}
                            <button
                              onClick={() => handleTogglePublish(post)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={post.is_published ? 'Unpublish' : 'Publish'}
                            >
                              {post.is_published ? (
                                <EyeOff className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditPost(post)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(post.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'No date'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.read_time}
                          </span>
                          <span className="font-mono">/blog/{post.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {deleteConfirm === post.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 mb-3">
                          Are you sure you want to delete "{post.title}"? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
