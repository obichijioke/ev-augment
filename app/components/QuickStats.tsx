import { Users, MessageSquare, Mail, Car } from 'lucide-react';

const QuickStats = () => {
  const stats = [
    {
      icon: Users,
      label: 'Total Members',
      value: '12,847',
      change: '+234 this month',
      color: 'text-blue-600',
    },
    {
      icon: MessageSquare,
      label: 'Forum Threads',
      value: '3,421',
      change: '+89 this week',
      color: 'text-green-600',
    },
    {
      icon: Mail,
      label: 'Messages',
      value: '45,892',
      change: '+1,234 today',
      color: 'text-purple-600',
    },
    {
      icon: Car,
      label: 'Vehicles in Showcase',
      value: '2,156',
      change: '+67 this week',
      color: 'text-orange-600',
    },
  ];

  return (
    <section className="bg-white py-12 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-50 p-3 rounded-full">
                    <IconComponent className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-600 font-medium mb-1">{stat.label}</p>
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;