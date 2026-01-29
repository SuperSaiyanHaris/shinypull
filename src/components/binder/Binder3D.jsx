import React from 'react';
import { motion } from 'framer-motion';

/**
 * 3D Binder Component
 * Displays a Pokemon card binder on a shelf with 3D perspective
 * Clicks trigger navigation to the binder viewer
 */
const Binder3D = ({
  set,
  collectedCount = 0,
  totalCards = 0,
  onClick,
  index = 0
}) => {
  // Generate a consistent color based on set name
  const getBinderColor = (setName) => {
    const colors = [
      { bg: 'from-red-600 to-red-800', spine: 'bg-red-900', accent: 'red' },
      { bg: 'from-blue-600 to-blue-800', spine: 'bg-blue-900', accent: 'blue' },
      { bg: 'from-purple-600 to-purple-800', spine: 'bg-purple-900', accent: 'purple' },
      { bg: 'from-green-600 to-green-800', spine: 'bg-green-900', accent: 'green' },
      { bg: 'from-yellow-500 to-yellow-700', spine: 'bg-yellow-800', accent: 'yellow' },
      { bg: 'from-pink-500 to-pink-700', spine: 'bg-pink-800', accent: 'pink' },
      { bg: 'from-indigo-600 to-indigo-800', spine: 'bg-indigo-900', accent: 'indigo' },
      { bg: 'from-teal-600 to-teal-800', spine: 'bg-teal-900', accent: 'teal' },
    ];
    const hash = setName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const binderColor = getBinderColor(set.name);
  const completionPercent = totalCards > 0 ? Math.round((collectedCount / totalCards) * 100) : 0;

  return (
    <motion.div
      className="cursor-pointer group perspective-1000"
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        scale: 1.05,
        rotateY: -5,
        z: 50,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Binder Container */}
      <div className="relative w-40 h-52 md:w-48 md:h-64" style={{ transformStyle: 'preserve-3d' }}>

        {/* Binder Spine (Left side - 3D depth) */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-4 ${binderColor.spine} rounded-l-sm shadow-inner`}
          style={{
            transform: 'translateZ(-8px) rotateY(-90deg)',
            transformOrigin: 'right center'
          }}
        />

        {/* Binder Back Cover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${binderColor.bg} rounded-r-lg rounded-l-sm opacity-50`}
          style={{ transform: 'translateZ(-16px)' }}
        />

        {/* Binder Front Cover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${binderColor.bg} rounded-r-lg rounded-l-sm shadow-2xl overflow-hidden`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden'
          }}
          whileHover={{
            rotateY: -8,
            transition: { duration: 0.4 }
          }}
        >
          {/* Binder Ring Holes */}
          <div className="absolute left-2 top-1/4 w-2 h-2 bg-black/30 rounded-full" />
          <div className="absolute left-2 top-1/2 w-2 h-2 bg-black/30 rounded-full" />
          <div className="absolute left-2 top-3/4 w-2 h-2 bg-black/30 rounded-full" />

          {/* Set Logo/Symbol Area */}
          <div className="absolute inset-x-4 top-4 h-20 md:h-24 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {set.logo ? (
              <img
                src={set.logo}
                alt={set.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-white/80 font-bold text-sm text-center px-2">
                {set.name}
              </span>
            )}
          </div>

          {/* Set Name Label */}
          <div className="absolute inset-x-3 bottom-16 md:bottom-20">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1.5">
              <p className="text-white font-bold text-xs md:text-sm text-center truncate drop-shadow-lg">
                {set.name}
              </p>
            </div>
          </div>

          {/* Collection Progress */}
          <div className="absolute inset-x-3 bottom-4 md:bottom-6">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-2">
              <div className="flex justify-between text-xs text-white/90 mb-1">
                <span>{collectedCount} / {totalCards}</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${completionPercent === 100 ? 'bg-green-400' : 'bg-white/80'} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
            initial={{ x: '-100%', opacity: 0 }}
            whileHover={{ x: '100%', opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Completion Badge */}
          {completionPercent === 100 && (
            <motion.div
              className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: index * 0.1 + 0.5 }}
            >
              <span className="text-lg">⭐</span>
            </motion.div>
          )}
        </motion.div>

        {/* 3D Shadow */}
        <div
          className="absolute -bottom-4 left-2 right-2 h-4 bg-black/20 blur-md rounded-full"
          style={{ transform: 'translateZ(-20px) rotateX(90deg)' }}
        />
      </div>

      {/* Hover instruction */}
      <motion.p
        className="text-center text-xs text-adaptive-tertiary mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ y: 10 }}
        whileHover={{ y: 0 }}
      >
        Click to open
      </motion.p>
    </motion.div>
  );
};

export default Binder3D;
