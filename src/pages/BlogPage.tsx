import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Footer } from '../components/Footer';
import { BLOGS } from '../constants/blogData';

export const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-green/5 blur-3xl rounded-full -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent-green/5 blur-3xl rounded-full translate-x-1/2 pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-accent-green font-bold tracking-[0.2em] uppercase text-xs mb-4"
          >
            OccasionScan Kenniscentrum
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-6"
          >
            Blog & <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">Inzichten</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl font-light leading-relaxed"
          >
            Alles wat je moet weten over het kopen, verkopen en onderhouden van je (toekomstige) auto.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {BLOGS.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full hover:border-accent-green/30 hover:bg-white/[0.05] transition-all duration-500 shadow-2xl"
            >
              <Link to={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden relative">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-accent-green text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
              </Link>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wider mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.readTime}</span>
                </div>
                
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-bold text-white mb-4 group-hover:text-accent-green transition-colors duration-300 leading-tight">
                    {post.title}
                  </h2>
                </Link>
                
                <p className="text-gray-400 text-sm font-light leading-relaxed mb-8 flex-grow line-clamp-3">
                  {post.excerpt}
                </p>
                
                <Link 
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-accent-green font-bold text-sm group/btn"
                >
                  Lees meer
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};
