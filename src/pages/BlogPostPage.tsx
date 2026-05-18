import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Facebook, 
  Twitter, 
  Linkedin,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { BLOGS, Blog } from '../constants/blogData';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOGS.find(b => b.slug === slug);
  const [relatedPosts, setRelatedPosts] = useState<Blog[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (post) {
      document.title = `${post.metaTitle}`;
      
      const related = BLOGS
        .filter(b => b.category === post.category && b.slug !== slug)
        .slice(0, 2);
      setRelatedPosts(related);
    }
  }, [post, slug]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = (currentScroll / totalScroll) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post.title;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden text-gray-200">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-white/5">
        <motion.div 
          className="h-full bg-accent-green shadow-[0_0_10px_rgba(0,200,83,0.5)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section - Full Width */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <img 
          src={post.featuredImage} 
          alt={post.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-6">
                  <span className="bg-accent-green text-black text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                    {post.category}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-white mb-8 leading-[1.1] tracking-tight">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green font-bold text-[10px] uppercase">
                      {post.author ? post.author.split(' ').map(n => n[0]).join('') : 'A'}
                    </div>
                    <span className="font-medium text-white">{post.author || 'OccasionScan Team'}</span>
                  </div>
                  <div className="h-4 w-px bg-white/20"></div>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent-green" /> {new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                  <div className="h-4 w-px bg-white/20"></div>
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent-green" /> {post.readTime} leestijd</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
          {/* Main Content Column */}
          <div className="flex-grow">
            {/* Back button */}
            <Link to="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent-green transition-colors mb-12 group text-sm font-medium">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Terug naar overzicht
            </Link>

            {/* Post Content */}
            <motion.article
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div 
                className="prose prose-invert prose-green max-w-none 
                  prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                  prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8
                  prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-accent-green
                  prose-p:text-gray-300 prose-p:leading-[1.8] prose-p:mb-8 prose-p:text-lg prose-p:font-light
                  prose-strong:text-white prose-strong:font-semibold
                  prose-a:text-accent-green prose-a:no-underline hover:prose-a:underline
                  prose-li:text-gray-300 prose-li:text-lg prose-li:mb-2
                  [&_a.bg-accent-green]:text-black [&_a.bg-accent-green]:no-underline
                  [&_h2]:border-l-4 [&_h2]:border-accent-green [&_h2]:pl-6
                  [&_div.bg-accent-green\/10]:!font-sans [&_div.bg-accent-green\/10]:!border-l-4 [&_div.bg-accent-green\/10]:!border-accent-green [&_div.bg-accent-green\/10]:!rounded-xl [&_div.bg-accent-green\/10]:!p-8 [&_div.bg-accent-green\/10]:!my-16 [&_div.bg-accent-green\/10]:!bg-accent-green/5
                  [&_div.mt-12.p-8.bg-gradient-to-br]:!font-sans [&_div.mt-12.p-8.bg-gradient-to-br]:!border-accent-green/30 [&_div.mt-12.p-8.bg-gradient-to-br]:!my-20"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
            </motion.article>
          </div>

          {/* Sidebar / Social Share */}
          <div className="lg:w-16 flex flex-col gap-6 sticky top-32 h-fit order-first lg:order-last">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] lg:[writing-mode:vertical-lr] text-center">Deel dit</span>
            <div className="flex lg:flex-col gap-4 justify-center">
              {[
                { Icon: Facebook, name: 'facebook' },
                { Icon: Twitter, name: 'twitter' },
                { Icon: Linkedin, name: 'linkedin' }
              ].map(({ Icon, name }, i) => (
                <button 
                  key={i} 
                  onClick={() => handleShare(name)}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-accent-green hover:border-accent-green transition-all shadow-xl group"
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Related / Next Posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-32 pt-16 border-t border-white/5">
            <h3 className="text-3xl font-heading font-bold text-white mb-12">Lees ook eens...</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`} className="group bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.05] hover:border-accent-green/20 transition-all duration-500 shadow-2xl">
                  <div className="flex flex-col sm:flex-row gap-8">
                    <div className="sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0">
                      <img src={relatedPost.featuredImage} alt={relatedPost.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-accent-green font-bold uppercase tracking-widest block mb-3">{relatedPost.category}</span>
                      <h4 className="text-xl font-bold text-white group-hover:text-accent-green transition-colors line-clamp-2 mb-3 leading-tight">{relatedPost.title}</h4>
                      <p className="text-gray-500 text-sm line-clamp-2 font-light">{relatedPost.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
