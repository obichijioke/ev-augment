'use client';

import { useState, useRef } from 'react';
import { Heart, Star, ArrowRight, Zap, Gauge, Clock, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const FeaturedEVs = () => {
  const [likedVehicles, setLikedVehicles] = useState<number[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const trendingVehicles = [
    {
      id: 1,
      name: 'Tesla Model S Plaid',
      manufacturer: 'Tesla',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%20S%20Plaid%20electric%20car%20in%20sleek%20black%20color%20on%20modern%20road%20with%20city%20skyline%20background%2C%20professional%20automotive%20photography%2C%20high%20quality%2C%20detailed&image_size=landscape_4_3',
      range: '405 miles',
      acceleration: '1.99s 0-60mph',
      topSpeed: '200 mph',
      rating: 4.8,
      reviews: 1247,
      trendingRank: 1,
      category: 'Luxury Sedan'
    },
    {
      id: 2,
      name: 'BMW iX xDrive50',
      manufacturer: 'BMW',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20iX%20xDrive50%20electric%20SUV%20in%20metallic%20blue%20color%20parked%20in%20modern%20urban%20setting%2C%20luxury%20automotive%20photography%2C%20high%20quality%2C%20detailed&image_size=landscape_4_3',
      range: '324 miles',
      acceleration: '4.6s 0-60mph',
      topSpeed: '124 mph',
      rating: 4.6,
      reviews: 892,
      trendingRank: 2,
      category: 'Luxury SUV'
    },
    {
      id: 3,
      name: 'Lucid Air Dream',
      manufacturer: 'Lucid Motors',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lucid%20Air%20Dream%20luxury%20electric%20sedan%20in%20pearl%20white%20color%20on%20scenic%20coastal%20highway%2C%20premium%20automotive%20photography%2C%20high%20quality%2C%20detailed&image_size=landscape_4_3',
      range: '516 miles',
      acceleration: '2.5s 0-60mph',
      topSpeed: '168 mph',
      rating: 4.9,
      reviews: 456,
      trendingRank: 3,
      category: 'Ultra-Luxury'
    },
    {
      id: 4,
      name: 'Ford Mustang Mach-E GT',
      manufacturer: 'Ford',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Ford%20Mustang%20Mach-E%20GT%20electric%20SUV%20in%20vibrant%20red%20color%20on%20mountain%20road%2C%20dynamic%20automotive%20photography%2C%20high%20quality%2C%20detailed&image_size=landscape_4_3',
      range: '270 miles',
      acceleration: '3.5s 0-60mph',
      topSpeed: '124 mph',
      rating: 4.4,
      reviews: 1089,
      trendingRank: 4,
      category: 'Performance SUV'
    },
    {
      id: 5,
      name: 'Rivian R1T',
      manufacturer: 'Rivian',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Rivian%20R1T%20electric%20pickup%20truck%20in%20forest%20green%20color%20on%20off-road%20trail%20with%20mountains%20background%2C%20adventure%20automotive%20photography%2C%20high%20quality%2C%20detailed&image_size=landscape_4_3',
      range: '314 miles',
      acceleration: '3.0s 0-60mph',
      topSpeed: '125 mph',
      rating: 4.5,
      reviews: 678,
      trendingRank: 5,
      category: 'Electric Truck'
    },
    {
      id: 6,
      name: 'Porsche Taycan Turbo S',
      manufacturer: 'Porsche',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Porsche%20Taycan%20Turbo%20S%20electric%20sports%20car%20in%20racing%20yellow%20color%20on%20race%20track%2C%20high-performance%20automotive%20photography%2C%20high%20quality%2C%20detailed&image_size=landscape_4_3',
      range: '227 miles',
      acceleration: '2.6s 0-60mph',
      topSpeed: '161 mph',
      rating: 4.7,
      reviews: 534,
      trendingRank: 6,
      category: 'Sports Car'
    }
  ];

  const toggleLike = (vehicleId: number) => {
    setLikedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingVehicles.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(trendingVehicles.length / 3)) % Math.ceil(trendingVehicles.length / 3));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Trending Electric Vehicles</h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the most popular and highly-rated electric vehicles that are making waves in the EV community
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>

          {/* Carousel */}
          <div className="overflow-hidden mx-12">
            <div 
              ref={carouselRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: Math.ceil(trendingVehicles.length / 3) }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingVehicles.slice(slideIndex * 3, slideIndex * 3 + 3).map((vehicle) => (
                      <div key={vehicle.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        {/* Trending Badge */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2 text-sm font-medium flex items-center justify-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>#{vehicle.trendingRank} Trending</span>
                        </div>
                        
                        <div className="relative overflow-hidden">
                          <img
                            src={vehicle.image}
                            alt={vehicle.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={() => toggleLike(vehicle.id)}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <Heart 
                                className={`h-4 w-4 transition-colors duration-200 ${
                                  likedVehicles.includes(vehicle.id) 
                                    ? 'text-red-500 fill-current' 
                                    : 'text-gray-400 hover:text-red-500'
                                }`} 
                              />
                            </button>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                              {vehicle.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{vehicle.name}</h3>
                            <p className="text-sm text-gray-600">{vehicle.manufacturer}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-900">{vehicle.rating}</span>
                              <span className="text-sm text-gray-600">({vehicle.reviews} reviews)</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Zap className="h-4 w-4" />
                                <span>Range</span>
                              </div>
                              <span className="font-medium text-gray-900">{vehicle.range}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>0-60mph</span>
                              </div>
                              <span className="font-medium text-gray-900">{vehicle.acceleration}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Gauge className="h-4 w-4" />
                                <span>Top Speed</span>
                              </div>
                              <span className="font-medium text-gray-900">{vehicle.topSpeed}</span>
                            </div>
                          </div>
                          
                          <Link 
                            href={`/ev-listings?model=${vehicle.name.replace(/\s+/g, '-').toLowerCase()}`}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 group"
                          >
                            <span>Learn More</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {Array.from({ length: Math.ceil(trendingVehicles.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentSlide === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href="/ev-listings"
            className="inline-flex items-center space-x-2 bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-600 font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <span>Explore All EV Models</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEVs;