// src/app/_components/StatCard.tsx
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface StatCardProps {
  bgColor: string;
  iconBgColor: string;
  icon: IconDefinition;
  title: string;
  value: number | string;
  isLoading?: boolean;
  textColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  bgColor,
  iconBgColor,
  icon,
  title,
  value,
  isLoading = false,
  textColor = "text-[#faf2e5]"
}) => {
  return (
    <div className={`${bgColor} rounded-xl shadow-sm p-4 h-24 flex items-center`}>
      <div className="flex items-center gap-4">
        <div className={`${iconBgColor} rounded-full w-14 h-14 flex items-center justify-center`}>
          <FontAwesomeIcon icon={icon} className={`text-xl ${textColor}`} />
        </div>
        <div>
          <h3 className="text-gray-600 text-sm">{title}</h3>
          {isLoading ? (
            <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;