import { useState, useEffect } from 'react'
import { useGear } from '../hooks/useApi'
import { ShoppingCart, Star, Loader } from 'lucide-react'

interface GearItem {
  id: number
  name: string
  description: string
  daily_price: number
  weekly_price?: number
  monthly_price?: number
  category?: any
  rating?: number
  review_count?: number
  main_image?: string
  main_image_url?: string
  images?: any[]
}

interface GearListComponentProps {
  onReserveClick: (gear: GearItem) => void
  searchQuery?: string  // Add this
}

// STATIC IMAGE MAPPING - Force these images to show
const STATIC_IMAGE_MAP: Record<string, string> = {
  'Family Basecamp': '/images/kit_family.jpg',
  'Night Light Kit': '/images/kit_lighting.jpg',
  'Alpine Shelter': '/images/kit_tent.jpg',
  'Trail Cook Set': '/images/kit_cookset.jpg',
  'Weekend Light Kit': '/images/kit_sleep_system.jpg',
  'Bikepacking Bundle': '/images/kit_bikepacking.jpg',
}

// ALL CATEGORIES - Always show these buttons
const ALL_CATEGORIES = ['All Gear', 'Family', 'Lighting', 'Camping', 'Backpacking']

// Nature/earthy color palette
const NATURE_COLORS = {
  sage: {
    DEFAULT: '#8B9A7D',
    dark: '#6B7A5D',
    light: '#ABBA9D',
    50: '#F5F7F4',
    100: '#E8EBE6',
    200: '#D1D7CD',
    300: '#B4C3B0',
    400: '#97A993',
    500: '#8B9A7D',
    600: '#6B7A5D',
    700: '#5A6A4D',
    800: '#4A5A3D',
    900: '#3A4A2D',
  },
  ochre: {
    DEFAULT: '#C9A86C',
    dark: '#A98B52',
    light: '#D9C59C',
  }
}

const getImageUrl = (item: GearItem): string => {
  if (STATIC_IMAGE_MAP[item.name]) {
    return STATIC_IMAGE_MAP[item.name]
  }
  
  if (item.main_image_url) {
    return item.main_image_url
  }
  
  if (item.main_image) {
    if (item.main_image.startsWith('http')) return item.main_image
    if (item.main_image.startsWith('/')) return item.main_image
    return `/media/${item.main_image}`
  }
  
  return '/images/placeholder.jpg'
}

export function GearListComponent({ onReserveClick }: GearListComponentProps) {
  const { gear, loading, error, fetchGear } = useGear()
  const [filterCategory, setFilterCategory] = useState('')
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchGear(filterCategory && filterCategory !== 'All Gear' ? { category: filterCategory } : {})
  }, [filterCategory, fetchGear])

  const handleImageError = (itemId: number) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }))
  }

  const handleCategoryClick = (category: string) => {
    setFilterCategory(category === 'All Gear' ? '' : category)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin" style={{ color: NATURE_COLORS.sage.DEFAULT }} size={40} />
        <span className="ml-3 text-lg text-gray-700">Loading gear...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-8">
        <p className="text-red-800 font-semibold">Error loading gear</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={() => fetchGear()} 
          className="mt-4 px-4 py-2 text-white rounded hover:opacity-90 transition"
          style={{ backgroundColor: NATURE_COLORS.sage.DEFAULT }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!gear || gear.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-8">
        <p className="text-yellow-800 font-semibold">No gear found</p>
        <button 
          onClick={() => fetchGear()} 
          className="mt-4 px-4 py-2 text-white rounded hover:opacity-90 transition"
          style={{ backgroundColor: NATURE_COLORS.ochre.DEFAULT }}
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Category Filter - ALWAYS SHOW ALL BUTTONS */}
      <div className="flex gap-2 flex-wrap">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = (cat === 'All Gear' && filterCategory === '') || 
                          (cat !== 'All Gear' && filterCategory === cat)
          
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="px-4 py-2 rounded-lg transition font-medium"
              style={{
                backgroundColor: isActive ? NATURE_COLORS.sage.DEFAULT : NATURE_COLORS.sage[100],
                color: isActive ? 'white' : NATURE_COLORS.sage[800],
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = NATURE_COLORS.sage[200]
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = NATURE_COLORS.sage[100]
                }
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Gear Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gear.map((item: GearItem) => {
          const imageUrl = getImageUrl(item)
          const hasImageError = imageErrors[item.id]
          const categoryName = typeof item.category === 'string' 
            ? item.category 
            : item.category?.name

          return (
            <div 
              key={item.id} 
              className="border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
              style={{ borderColor: NATURE_COLORS.sage[200] }}
            >
              {/* Image */}
              <div className="w-full h-48 overflow-hidden relative group" style={{ backgroundColor: NATURE_COLORS.sage[50] }}>
                {!hasImageError ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-5xl mb-2">🏕️</div>
                    <span className="text-sm font-medium" style={{ color: NATURE_COLORS.sage[600] }}>
                      Image failed to load
                    </span>
                  </div>
                )}
                
                {/* Category Badge */}
                {categoryName && (
                  <div 
                    className="absolute top-3 left-3 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(107, 122, 93, 0.8)' }}
                  >
                    {categoryName}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-xl font-bold" style={{ color: NATURE_COLORS.sage[900] }}>
                  {item.name}
                </h3>
                <p className="text-sm line-clamp-2" style={{ color: NATURE_COLORS.sage[700] }}>
                  {item.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <Star 
                    className="w-4 h-4" 
                    style={{ 
                      fill: item.rating ? NATURE_COLORS.ochre.DEFAULT : 'transparent',
                      color: item.rating ? NATURE_COLORS.ochre.DEFAULT : NATURE_COLORS.sage[300]
                    }} 
                  />
                  <span className="font-semibold text-sm" style={{ color: NATURE_COLORS.sage[800] }}>
                    {item.rating ? Number(item.rating).toFixed(1) : '0.0'}
                  </span>
                  <span className="text-xs" style={{ color: NATURE_COLORS.sage[500] }}>
                    ({item.review_count || 0} reviews)
                  </span>
                </div>

                {/* Pricing */}
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: NATURE_COLORS.sage[50] }}
                >
                  <div className="flex justify-between text-sm items-center">
                    <span style={{ color: NATURE_COLORS.sage[600] }}>Daily:</span>
                    <span className="font-bold text-blue-600 text-base">
                      {item.daily_price} TND  {/* Remove the $ sign */}
                    </span>
                  </div>
                </div>

                {/* Reserve Now Button - NATURE COLOR */}
                <button
                  onClick={() => onReserveClick(item)}
                  className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: NATURE_COLORS.sage.DEFAULT,
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = NATURE_COLORS.sage.dark
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = NATURE_COLORS.sage.DEFAULT
                  }}
                >
                  <ShoppingCart size={18} />
                  Reserve Now
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GearListComponent