import {
  Clock,
  MessageSquare,
  Heart,
  Eye,
  User,
  Car,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

const WhatsNewFeed = () => {
  const feedItems = [
    {
      id: 1,
      type: "forum",
      title: "Tesla Model 3 vs Model Y - Which one should I choose?",
      author: "EVEnthusiast23",
      avatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20person%20interested%20in%20electric%20vehicles&image_size=square",
      timestamp: "2 hours ago",
      category: "Tesla Discussion",
      replies: 24,
      views: 156,
      likes: 12,
      excerpt:
        "I'm torn between the Model 3 and Model Y. Both seem great but I need help deciding based on my daily commute and family needs...",
    },
    {
      id: 2,
      type: "marketplace",
      title: "Tesla Model S 2021 - Excellent Condition",
      author: "TeslaOwner2021",
      avatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tesla%20owner&image_size=square",
      timestamp: "4 hours ago",
      price: "$67,500",
      location: "San Francisco, CA",
      mileage: "15,000 miles",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%20S%202021%20electric%20car%20in%20excellent%20condition%20parked%20outside&image_size=landscape_16_9",
    },
    {
      id: 3,
      type: "garage",
      title: "My BMW i4 M50 Setup - 6 Months Review",
      author: "BMWElectric",
      avatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20BMW%20electric%20car%20enthusiast&image_size=square",
      timestamp: "6 hours ago",
      category: "BMW Showcase",
      likes: 45,
      comments: 18,
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20i4%20M50%20electric%20car%20in%20garage%20setup%20with%20charging%20station&image_size=landscape_16_9",
    },
    {
      id: 4,
      type: "forum",
      title: "Best Home Charging Solutions for Apartment Dwellers",
      author: "ChargingExpert",
      avatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20EV%20charging%20expert&image_size=square",
      timestamp: "8 hours ago",
      category: "Charging Discussion",
      replies: 31,
      views: 289,
      likes: 22,
      excerpt:
        "Living in an apartment but want to go electric? Here are the best charging solutions I've found after extensive research...",
    },
    {
      id: 5,
      type: "marketplace",
      title: "Level 2 Home Charger - ChargePoint Home Flex",
      author: "EVAccessories",
      avatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20EV%20accessories%20seller&image_size=square",
      timestamp: "12 hours ago",
      price: "$649",
      location: "Austin, TX",
      condition: "New in Box",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ChargePoint%20Home%20Flex%20Level%202%20EV%20charger%20new%20in%20box&image_size=landscape_4_3",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "forum":
        return MessageSquare;
      case "marketplace":
        return ShoppingBag;
      case "garage":
        return Car;
      default:
        return MessageSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "forum":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "marketplace":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "garage":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          What's New
        </h2>
        <Link
          href="/whats-new"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-6">
        {feedItems.map((item) => {
          const TypeIcon = getTypeIcon(item.type);
          const typeColor = getTypeColor(item.type);

          return (
            <div
              key={item.id}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start space-x-4">
                {/* Type Icon */}
                <div className={`p-2 rounded-lg ${typeColor}`}>
                  <TypeIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={item.avatar}
                      alt={item.author}
                      className="h-6 w-6 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.author}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      •
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.timestamp}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    {item.title}
                  </h3>

                  {/* Forum Post */}
                  {item.type === "forum" && (
                    <>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {item.excerpt}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                          {item.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{item.replies} replies</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{item.views} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{item.likes} likes</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Marketplace Item */}
                  {item.type === "marketplace" && (
                    <>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {item.price}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          •
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.location}
                        </span>
                        {"mileage" in item && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400">
                              •
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {item.mileage}
                            </span>
                          </>
                        )}
                        {"condition" in item && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400">
                              •
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {item.condition}
                            </span>
                          </>
                        )}
                      </div>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </>
                  )}

                  {/* Garage Showcase */}
                  {item.type === "garage" && (
                    <>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                          {item.category}
                        </span>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <Heart className="h-4 w-4" />
                          <span>{item.likes} likes</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <MessageSquare className="h-4 w-4" />
                          <span>{item.comments} comments</span>
                        </div>
                      </div>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WhatsNewFeed;
