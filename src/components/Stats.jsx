import React from 'react';
import { Database, TrendingUp, Users } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: <Database className="w-6 h-6" />,
      value: '2.4M+',
      label: 'Cards tracked',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: '24/7',
      label: 'Price updates',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: '50K+',
      label: 'Active users',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-effect rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-100 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
