import React from 'react';

export type SortType = 'mostRecent' | 'mostHelpful' | 'relevance' | 'mostPopular' | 'mostRelevant' | 'local';

export type SortCategory = 'reviews' | 'restaurants';

export interface SortOption {
  value: SortType;
  label: string;
  description?: string;
}

interface SortDropdownProps {
  category: SortCategory;
  currentSort: SortType;
  onSortChange: (sortType: SortType) => void;
  className?: string;
}

const SORT_OPTIONS: Record<SortCategory, SortOption[]> = {
  reviews: [
    { value: 'mostRecent', label: 'Most Recent', description: 'Sort by newest reviews first' },
    { value: 'mostHelpful', label: 'Most Helpful', description: 'Sort by highest upvotes' },
    { value: 'relevance', label: 'Relevance', description: 'Sort by your registered interests' }
  ],
  restaurants: [
    { value: 'mostPopular', label: 'Most Popular', description: 'Sort by number of reviews' },
    { value: 'mostRelevant', label: 'Most Relevant (TBC)', description: 'Sort by your registered interests' },
    { value: 'local', label: 'Local', description: 'Sort by distance to you' }
  ]
};

const SortDropdown: React.FC<SortDropdownProps> = ({ 
  category, 
  currentSort, 
  onSortChange,
  className = ''
}) => {
  const options = SORT_OPTIONS[category];
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortType);
  };

  return (
    <div className={`sort-dropdown-container flex items-center ${className}`}>
      <span className="mr-2 text-sm text-gray-600">Sort By:</span>
      <div className="relative">
        <select
          value={currentSort}
          onChange={handleChange}
          className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#D29501] cursor-pointer"
          aria-label="Sort options"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SortDropdown;