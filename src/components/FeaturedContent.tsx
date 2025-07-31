import { TrendingUp, Star, Users, Eye, MessageSquare, Award } from 'lucide-react';
import Link from 'next/link';

const FeaturedContent = () => {
  const trendingDiscussions = [
    {
      id: 1,
      title: 'Tesla FSD Beta vs Autopilot: Real World Comparison',
      replies: 156,
      views: 2847,
      trending: true
    },
    {
      id: 2,
      title: 'Best EV Road Trip Routes in 2024',
      replies: 89,
      views: 1923,
      trending: true
    },
    {
      id: 3,
      title: 'Charging Network Expansion Update',
      replies: 67,
      views: 1456,
      trending: false
    }
  ];

  const popularVehicles = [
    {
      id: 1,
      name: 'Tesla Model 3',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20electric%20car%20side%20view%20modern%20design&image_size=landscape_4_3',
      price: 'From $38,990',
      range: '358 miles',
      views: 3421
    },
    {
      id: 2,
      name: 'BMW i4 M50',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20i4%20M50%20electric%20car%20side%20view%20sporty%20design&image_size=landscape_4_3',
      price: 'From $67,300',
      range: '270 miles',
      views: 2156
    },
    {
      id: 3,
      name: 'Audi e-tron GT',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Audi%20e-tron%20GT%20electric%20car%20side%20view%20luxury%20design&image_size=landscape_4_3',
      price: 'From $102,400',
      range: '238 miles',
      views: 1834
    }
  ];

  const activeMembers = [
    {
      id: 1,
      name: 'ElectricGuru',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20electric%20vehicle%20expert&image_size=square',
      posts: 1247,
      reputation: 9.8,
      badge: 'Expert'
    },
    {
      id: 2,
      name: 'TeslaFan2024',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20Tesla%20enthusiast&image_size=square',
      posts: 892,
      reputation: 9.5,
      badge: 'Contributor'
    },
    {
      id: 3,
      name: 'EVNewbie',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20new%20EV%20enthusiast&image_size=square',
      posts: 234,
      reputation: 8.9,
      badge: 'Rising Star'
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Expert':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'Contributor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'Rising Star':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Trending Discussions */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Discussions</h3>
        </div>
        <div className="space-y-4">
          {trendingDiscussions.map((discussion) => (
            <div key={discussion.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer mb-2">
                    {discussion.title}
                    {discussion.trending && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                        🔥 Hot
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{discussion.replies}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{discussion.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/forums" className="block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Discussions →
        </Link>
      </div>

      {/* Popular Vehicles */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Star className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Popular Vehicles</h3>
        </div>
        <div className="space-y-4">
          {popularVehicles.map((vehicle) => (
            <div key={vehicle.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
              <div className="flex space-x-3">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-16 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                    {vehicle.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">{vehicle.price}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{vehicle.range} range</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Eye className="h-3 w-3" />
                      <span>{vehicle.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/ev-listings" className="block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Explore All Vehicles →
        </Link>
      </div>

      {/* Active Members */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Active Members</h3>
        </div>
        <div className="space-y-4">
          {activeMembers.map((member) => (
            <div key={member.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-center space-x-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                      {member.name}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(member.badge)}`}>
                      {member.badge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{member.posts} posts</span>
                    <div className="flex items-center space-x-1">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">{member.reputation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/garage" className="block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Members →
        </Link>
      </div>
    </div>
  );
};

export default FeaturedContent;