import Link from 'next/link';
import { MessageSquare, Users, Car, TrendingUp, Clock, Eye, Heart, ArrowRight } from 'lucide-react';
import QuickStats from './components/QuickStats';
import FeaturedContent from './components/FeaturedContent';
import WhatsNewFeed from './components/WhatsNewFeed';
import FeaturedEVs from './components/FeaturedEVs';

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20electric%20vehicle%20charging%20station%20futuristic%20design%20blue%20lighting%20technology%20clean%20energy%20sustainable%20transportation&image_size=landscape_16_9"
            alt="Electric Vehicle Charging Station"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-blue-700/80 to-indigo-800/60"></div>
        </div>
        
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-indigo-300/15 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-in">
              <span className="text-sm font-medium text-blue-100">🚗 Join 50,000+ EV Enthusiasts</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-tight">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Electric Mobility</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Connect with passionate EV enthusiasts, discover cutting-edge vehicles, and be part of the sustainable transportation revolution
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/forums" className="group bg-white text-blue-600 hover:bg-blue-50 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Join Community</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/ev-listings" className="group bg-transparent border-2 border-white/30 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Explore EVs</span>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">50K+</div>
                <div className="text-sm text-blue-200">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">1.2K+</div>
                <div className="text-sm text-blue-200">EV Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">25K+</div>
                <div className="text-sm text-blue-200">Discussions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-blue-200">Businesses</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)"/>
          </svg>
        </div>
      </section>

      {/* Quick Stats */}
      <QuickStats />

      {/* Featured EVs Section */}
      <FeaturedEVs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* What's New Feed */}
          <div className="lg:col-span-2">
            <WhatsNewFeed />
          </div>

          {/* Featured Content Sidebar */}
          <div className="lg:col-span-1">
            <FeaturedContent />
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Explore Our Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/forums" className="group">
              <div className="card hover:shadow-lg transition-shadow duration-200">
                <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">Forums</h3>
                <p className="text-gray-600 text-sm">Join discussions about EVs, charging, and more</p>
              </div>
            </Link>
            
            <Link href="/marketplace" className="group">
              <div className="card hover:shadow-lg transition-shadow duration-200">
                <Car className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">Marketplace</h3>
                <p className="text-gray-600 text-sm">Buy and sell EVs, parts, and accessories</p>
              </div>
            </Link>
            
            <Link href="/garage" className="group">
              <div className="card hover:shadow-lg transition-shadow duration-200">
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">Garage</h3>
                <p className="text-gray-600 text-sm">Showcase your EV and connect with owners</p>
              </div>
            </Link>
            
            <Link href="/directory" className="group">
              <div className="card hover:shadow-lg transition-shadow duration-200">
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">Directory</h3>
                <p className="text-gray-600 text-sm">Find EV businesses and services near you</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
