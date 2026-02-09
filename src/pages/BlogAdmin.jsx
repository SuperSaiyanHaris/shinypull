import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Image,
  Package,
  ShoppingBag,
  Copy,
  ShieldX,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { TIMEOUTS, BLOG_CATEGORIES } from '../lib/constants';
import {
  getAllPostsAdmin,
  createPost,
  updatePost,
  deletePost,
  togglePublish,
  generateSlug,
} from '../services/blogAdminService';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  generateProductSlug,
} from '../services/productsService';

// Use BLOG_CATEGORIES from constants

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

const emptyProduct = {
  name: '',
  slug: '',
  price: '',
  badge: '',
  description: '',
  features: [],
  image: '',
  affiliate_link: '',
  is_active: true,
};

export default function BlogAdmin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Post Editor state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [postFormData, setPostFormData] = useState(emptyPost);

  // Product Editor state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productFormData, setProductFormData] = useState(emptyProduct);
  const [featuresInput, setFeaturesInput] = useState('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null });

  // Form validation errors
  const [postErrors, setPostErrors] = useState({});
  const [productErrors, setProductErrors] = useState({});

  // Check admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    async function checkAdmin() {
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        const data = await res.json();
        setIsAdmin(data.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminChecked(true);
      }
    }
    checkAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  // Scroll to top when entering edit mode
  useEffect(() => {
    if (isEditingPost || isEditingProduct) {
      window.scrollTo(0, 0);
    }
  }, [isEditingPost, isEditingProduct]);

  async function fetchData() {
    try {
      setLoading(true);
      const [postsData, productsData] = await Promise.all([
        getAllPostsAdmin(),
        getAllProducts(),
      ]);
      setPosts(postsData || []);
      setProducts(productsData || []);
    } catch (err) {
      setError('Failed to load data. Make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(message) {
    setSuccess(message);
    setTimeout(() => setSuccess(null), TIMEOUTS.SUCCESS_MESSAGE);
  }

  function showError(message) {
    setError(message);
    setTimeout(() => setError(null), TIMEOUTS.ERROR_MESSAGE);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  }

  // ===== POST HANDLERS =====
  function handleNewPost() {
    setCurrentPost(null);
    setPostFormData(emptyPost);
    setIsEditingPost(true);
  }

  function handleEditPost(post) {
    setCurrentPost(post);
    setPostFormData({
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
    setIsEditingPost(true);
  }

  function handleCancelPostEdit() {
    setIsEditingPost(false);
    setCurrentPost(null);
    setPostFormData(emptyPost);
    setPostErrors({});
  }

  function validatePost(data) {
    const errors = {};
    if (!data.title?.trim()) errors.title = 'Title is required';
    if (!data.slug?.trim()) errors.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(data.slug)) errors.slug = 'Slug must be lowercase with hyphens only';
    if (!data.content?.trim()) errors.content = 'Content is required';
    if (!data.description?.trim()) errors.description = 'Description is required for SEO';
    if (data.image && !data.image.startsWith('http')) errors.image = 'Image must be a valid URL';
    return errors;
  }

  function handlePostInputChange(e) {
    const { name, value, type, checked } = e.target;
    setPostFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'title' && !currentPost) {
      setPostFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  }

  async function handleSavePost() {
    const errors = validatePost(postFormData);
    setPostErrors(errors);
    if (Object.keys(errors).length > 0) {
      showError('Please fix the validation errors');
      return;
    }
    try {
      setSaving(true);
      if (currentPost) {
        await updatePost(currentPost.id, postFormData);
        showSuccess('Post updated!');
      } else {
        await createPost({ ...postFormData, published_at: new Date().toISOString().split('T')[0] });
        showSuccess('Post created!');
      }
      await fetchData();
      handleCancelPostEdit();
    } catch (err) {
      showError(err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePostPublish(post) {
    try {
      await togglePublish(post.id, !post.is_published);
      await fetchData();
      showSuccess(post.is_published ? 'Post unpublished' : 'Post published!');
    } catch (err) {
      showError('Failed to update publish status');
    }
  }

  async function handleDeletePost(id) {
    try {
      await deletePost(id);
      await fetchData();
      setDeleteConfirm({ type: null, id: null });
      showSuccess('Post deleted');
    } catch (err) {
      showError('Failed to delete post');
    }
  }

  // ===== PRODUCT HANDLERS =====
  function handleNewProduct() {
    setCurrentProduct(null);
    setProductFormData(emptyProduct);
    setFeaturesInput('');
    setIsEditingProduct(true);
  }

  function handleEditProduct(product) {
    setCurrentProduct(product);
    setProductFormData({
      name: product.name || '',
      slug: product.slug || '',
      price: product.price || '',
      badge: product.badge || '',
      description: product.description || '',
      features: product.features || [],
      image: product.image || '',
      affiliate_link: product.affiliate_link || '',
      is_active: product.is_active ?? true,
    });
    setFeaturesInput((product.features || []).join('\n'));
    setIsEditingProduct(true);
  }

  function handleCancelProductEdit() {
    setIsEditingProduct(false);
    setCurrentProduct(null);
    setProductFormData(emptyProduct);
    setFeaturesInput('');
    setProductErrors({});
  }

  function validateProduct(data) {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Product name is required';
    if (!data.slug?.trim()) errors.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(data.slug)) errors.slug = 'Slug must be lowercase with hyphens only';
    if (!data.affiliate_link?.trim()) errors.affiliate_link = 'Affiliate link is required';
    else if (!data.affiliate_link.startsWith('http')) errors.affiliate_link = 'Must be a valid URL';
    if (data.image && !data.image.startsWith('http')) errors.image = 'Image must be a valid URL';
    return errors;
  }

  function handleProductInputChange(e) {
    const { name, value, type, checked } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'name' && !currentProduct) {
      setProductFormData(prev => ({ ...prev, slug: generateProductSlug(value) }));
    }
  }

  function handleFeaturesChange(e) {
    setFeaturesInput(e.target.value);
    const features = e.target.value.split('\n').filter(f => f.trim());
    setProductFormData(prev => ({ ...prev, features }));
  }

  async function handleSaveProduct() {
    const errors = validateProduct(productFormData);
    setProductErrors(errors);
    if (Object.keys(errors).length > 0) {
      showError('Please fix the validation errors');
      return;
    }
    try {
      setSaving(true);
      if (currentProduct) {
        await updateProduct(currentProduct.id, productFormData);
        showSuccess('Product updated!');
      } else {
        await createProduct(productFormData);
        showSuccess('Product created!');
      }
      await fetchData();
      handleCancelProductEdit();
    } catch (err) {
      showError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleProductActive(product) {
    try {
      await toggleProductActive(product.id, !product.is_active);
      await fetchData();
      showSuccess(product.is_active ? 'Product deactivated' : 'Product activated!');
    } catch (err) {
      showError('Failed to update product status');
    }
  }

  async function handleDeleteProduct(id) {
    try {
      await deleteProduct(id);
      await fetchData();
      setDeleteConfirm({ type: null, id: null });
      showSuccess('Product deleted');
    } catch (err) {
      showError('Failed to delete product');
    }
  }

  if (authLoading || !adminChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
          <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const isEditing = isEditingPost || isEditingProduct;

  return (
    <>
      <SEO title="Blog Admin" description="Manage blog posts and products" />

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/blog" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Blog Admin</h1>
                  <p className="text-sm text-gray-500">
                    {posts.length} posts · {products.length} products
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={activeTab === 'posts' ? handleNewPost : handleNewProduct}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New {activeTab === 'posts' ? 'Post' : 'Product'}
                </button>
              )}
            </div>

            {/* Tabs */}
            {!isEditing && (
              <div className="flex gap-1 mt-4">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'products'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Products
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {(error || success) && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                {success}
              </div>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* POST EDITOR */}
          {isEditingPost && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentPost ? 'Edit Post' : 'Create New Post'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCancelPostEdit} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSavePost} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input type="text" name="title" value={postFormData.title} onChange={handlePostInputChange} placeholder="Best Streaming Setup for 2026" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${postErrors.title ? 'border-red-500' : 'border-gray-300'}`} />
                    {postErrors.title && <p className="mt-1 text-sm text-red-600">{postErrors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <input type="text" name="slug" value={postFormData.slug} onChange={handlePostInputChange} placeholder="best-streaming-setup-2026" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white ${postErrors.slug ? 'border-red-500' : 'border-gray-300'}`} />
                    {postErrors.slug && <p className="mt-1 text-sm text-red-600">{postErrors.slug}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input type="text" name="description" value={postFormData.description} onChange={handlePostInputChange} placeholder="A brief description for SEO" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${postErrors.description ? 'border-red-500' : 'border-gray-300'}`} />
                  {postErrors.description && <p className="mt-1 text-sm text-red-600">{postErrors.description}</p>}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select name="category" value={postFormData.category} onChange={handlePostInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white">
                      {BLOG_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input type="text" name="author" value={postFormData.author} onChange={handlePostInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Read Time</label>
                    <input type="text" name="read_time" value={postFormData.read_time} onChange={handlePostInputChange} placeholder="5 min read" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                  <input type="text" name="image" value={postFormData.image} onChange={handlePostInputChange} placeholder="https://images.unsplash.com/..." className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${postErrors.image ? 'border-red-500' : 'border-gray-300'}`} />
                  {postErrors.image && <p className="mt-1 text-sm text-red-600">{postErrors.image}</p>}
                  {postFormData.image && <img src={postFormData.image} alt="Preview" className="mt-2 w-full max-w-md h-32 object-cover rounded-lg border border-gray-200" onError={(e) => e.target.style.display = 'none'} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown) *</label>
                  <p className="text-xs text-gray-500 mb-2">Use {"{{product:slug}}"} to embed product cards</p>
                  <textarea name="content" value={postFormData.content} onChange={handlePostInputChange} rows={16} placeholder="# Your Article Title..." className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white ${postErrors.content ? 'border-red-500' : 'border-gray-300'}`} />
                  {postErrors.content && <p className="mt-1 text-sm text-red-600">{postErrors.content}</p>}
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input type="checkbox" id="is_published" name="is_published" checked={postFormData.is_published} onChange={handlePostInputChange} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="is_published" className="flex-1">
                    <span className="font-medium text-gray-900">Publish immediately</span>
                    <p className="text-sm text-gray-500">When checked, the post will be visible on the public blog</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT EDITOR */}
          {isEditingProduct && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentProduct ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCancelProductEdit} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSaveProduct} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" name="name" value={productFormData.name} onChange={handleProductInputChange} placeholder="Fifine K669B USB Microphone" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${productErrors.name ? 'border-red-500' : 'border-gray-300'}`} />
                    {productErrors.name && <p className="mt-1 text-sm text-red-600">{productErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <div className="flex gap-2">
                      <input type="text" name="slug" value={productFormData.slug} onChange={handleProductInputChange} placeholder="fifine-k669b" className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white ${productErrors.slug ? 'border-red-500' : 'border-gray-300'}`} />
                      <button onClick={() => copyToClipboard(`{{product:${productFormData.slug}}}`)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Copy embed code">
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    {productErrors.slug && <p className="mt-1 text-sm text-red-600">{productErrors.slug}</p>}
                    <p className="text-xs text-gray-500 mt-1">Use in posts: {"{{product:" + (productFormData.slug || 'slug') + "}}"}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Affiliate Link *</label>
                  <input type="text" name="affiliate_link" value={productFormData.affiliate_link} onChange={handleProductInputChange} placeholder="https://amzn.to/..." className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${productErrors.affiliate_link ? 'border-red-500' : 'border-gray-300'}`} />
                  {productErrors.affiliate_link && <p className="mt-1 text-sm text-red-600">{productErrors.affiliate_link}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Image URL</label>
                  <input type="text" name="image" value={productFormData.image} onChange={handleProductInputChange} placeholder="https://m.media-amazon.com/images/I/..." className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${productErrors.image ? 'border-red-500' : 'border-gray-300'}`} />
                  {productErrors.image && <p className="mt-1 text-sm text-red-600">{productErrors.image}</p>}
                  <p className="text-xs text-gray-500 mt-1">Right-click product image on Amazon → "Open image in new tab" → Copy URL</p>
                  {productFormData.image && (
                    <div className="mt-2 w-32 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2">
                      <img src={productFormData.image} alt="Preview" className="max-h-full max-w-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input type="text" name="price" value={productFormData.price} onChange={handleProductInputChange} placeholder="~$30" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                    <input type="text" name="badge" value={productFormData.badge} onChange={handleProductInputChange} placeholder="Budget Pick, Most Popular, etc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" name="description" value={productFormData.description} onChange={handleProductInputChange} placeholder="Brief product description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                  <textarea value={featuresInput} onChange={handleFeaturesChange} rows={4} placeholder="USB plug-and-play&#10;Cardioid pickup pattern&#10;Volume knob on mic" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input type="checkbox" id="is_active" name="is_active" checked={productFormData.is_active} onChange={handleProductInputChange} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="is_active" className="flex-1">
                    <span className="font-medium text-gray-900">Active</span>
                    <p className="text-sm text-gray-500">When active, this product can be embedded in blog posts</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* POSTS LIST */}
          {!isEditing && activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
                  <button onClick={handleNewPost} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Create Post
                  </button>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex gap-4">
                      {post.image && (
                        <div className="hidden sm:block w-32 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={post.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {post.is_published ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"><Eye className="w-3 h-3" />Published</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"><EyeOff className="w-3 h-3" />Draft</span>
                              )}
                              <span className="text-xs text-gray-500">{post.category}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                            <p className="text-sm text-gray-500 truncate">{post.description}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {post.is_published && (
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View post">
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                              </a>
                            )}
                            <button onClick={() => handleTogglePostPublish(post)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={post.is_published ? 'Unpublish' : 'Publish'}>
                              {post.is_published ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                            </button>
                            <button onClick={() => handleEditPost(post)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button onClick={() => setDeleteConfirm({ type: 'post', id: post.id })} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'No date'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time}</span>
                        </div>
                      </div>
                    </div>
                    {deleteConfirm.type === 'post' && deleteConfirm.id === post.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 mb-3">Are you sure you want to delete "{post.title}"?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDeletePost(post.id)} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                          <button onClick={() => setDeleteConfirm({ type: null, id: null })} className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRODUCTS LIST */}
          {!isEditing && activeTab === 'products' && (
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-500 mb-4">Add affiliate products to embed in your blog posts</p>
                  <button onClick={handleNewProduct} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              ) : (
                products.map(product => (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex gap-4">
                      {product.image && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center p-1">
                          <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {product.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"><Eye className="w-3 h-3" />Active</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"><EyeOff className="w-3 h-3" />Inactive</span>
                              )}
                              {product.badge && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">{product.badge}</span>}
                              {product.price && <span className="text-sm font-semibold text-gray-900">{product.price}</span>}
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{product.description}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => copyToClipboard(`{{product:${product.slug}}}`)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Copy embed code">
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                            <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View on Amazon">
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </a>
                            <button onClick={() => handleToggleProductActive(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={product.is_active ? 'Deactivate' : 'Activate'}>
                              {product.is_active ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                            </button>
                            <button onClick={() => handleEditProduct(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button onClick={() => setDeleteConfirm({ type: 'product', id: product.id })} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{"{{product:" + product.slug + "}}"}</code>
                        </div>
                      </div>
                    </div>
                    {deleteConfirm.type === 'product' && deleteConfirm.id === product.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 mb-3">Are you sure you want to delete "{product.name}"?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                          <button onClick={() => setDeleteConfirm({ type: null, id: null })} className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
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
