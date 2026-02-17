// components/GearRecommendation.tsx
import React, { useState } from 'react';
import { Send, Backpack, MapPin, Calendar, Clock, Loader2, X, Leaf, Tent, Mountain } from 'lucide-react';

// Nature color palette - matches your App.tsx
const NATURE = {
  sage: {
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
    light: '#D9C59C',
    dark: '#A98B52',
  },
  cream: '#FAF9F6',
};

interface Recommendation {
  id: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
}

interface RecommendationsData {
  climate_overview: string;
  recommended_kits: Recommendation[];
}

interface GearRecommendationProps {
  isOpen: boolean;
  onClose: () => void;
  onReserveClick?: (kitName: string) => void;
}

export default function GearRecommendation({ isOpen, onClose, onReserveClick }: GearRecommendationProps) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [error, setError] = useState('');

  const getRecommendations = async () => {
    if (!destination || !startDate || !duration) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setRecommendations(null);

    try {
      const prompt = `You are an expert camping gear consultant for outdoor adventures in Tunisia and worldwide.

Destination: ${destination}
Travel Date: ${startDate}
Duration: ${duration} days

Based on this trip information, provide detailed gear recommendations. Consider:
- Climate and weather conditions for that destination and time of year
- Camping terrain (mountain, desert, forest, beach, etc.)
- Trip duration and packing constraints
- Essential vs optional items
- Cooking gear, sleeping systems, shelter, lighting
- Clothing appropriate for the climate
- Health and safety items
- Any destination-specific gear

Format your response as a structured JSON object with these exact fields:
{
  "climate_overview": "brief climate description and weather conditions",
  "recommended_kits": [
    {
      "id": "unique_id_like_sleep_system_1",
      "name": "Gear Kit Name (e.g., Desert Sleep System, Mountain Cooking Kit)",
      "description": "Detailed description of what this kit includes and why it's needed",
      "priority": "essential" or "recommended" or "optional"
    }
  ]
}

Respond ONLY with valid JSON, no additional text. Make sure the recommended_kits array contains 5-8 different gear kits with appropriate priorities.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful camping gear expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean the response to extract JSON
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\s*/i, '').replace(/```\s*$/i, '');
      }
      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(jsonContent);
      setRecommendations(parsed);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to get recommendations. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getRecommendations();
  };

  const handleReserveKit = (kitName: string) => {
    onReserveClick?.(kitName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: NATURE.cream }}
      >
        {/* Header - Nature gradient */}
        <div 
          className="relative text-white p-6 flex justify-between items-center overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${NATURE.sage[600]} 0%, ${NATURE.sage[500]} 50%, ${NATURE.ochre.DEFAULT} 100%)` 
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Mountain size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Gear Advisor</h2>
              <p className="text-white/90 text-sm">Get personalized camping recommendations</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Form */}
          {!recommendations && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label 
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: NATURE.sage[700] }}
                >
                  <MapPin size={18} />
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Sahara Desert, Tunisia or Alps, France"
                  className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition"
                  style={{ 
                    borderColor: NATURE.sage[200],
                    backgroundColor: 'white',
                  }}
                  onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                  onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label 
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: NATURE.sage[700] }}
                  >
                    <Calendar size={18} />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition"
                    style={{ 
                      borderColor: NATURE.sage[200],
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                    onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                  />
                </div>

                <div className="space-y-2">
                  <label 
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: NATURE.sage[700] }}
                  >
                    <Clock size={18} />
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 7"
                    min="1"
                    className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition"
                    style={{ 
                      borderColor: NATURE.sage[200],
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                    onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl flex gap-2">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, ${NATURE.sage[500]} 0%, ${NATURE.sage[600]} 100%)`,
                  color: 'white',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing Your Adventure...
                  </>
                ) : (
                  <>
                    <Leaf size={20} />
                    Get Gear Recommendations
                  </>
                )}
              </button>
            </form>
          )}

          {/* Recommendations Display */}
          {recommendations && (
            <div className="space-y-6">
              {/* Climate Overview */}
              {recommendations.climate_overview && (
                <div 
                  className="border-2 p-5 rounded-xl"
                  style={{ 
                    backgroundColor: NATURE.sage[50],
                    borderColor: NATURE.sage[200],
                  }}
                >
                  <h3 
                    className="font-bold mb-2 text-lg flex items-center gap-2"
                    style={{ color: NATURE.sage[800] }}
                  >
                    🌤️ Climate Overview
                  </h3>
                  <p style={{ color: NATURE.sage[700] }}>{recommendations.climate_overview}</p>
                </div>
              )}

              {/* Recommended Gear Kits */}
              {recommendations.recommended_kits && recommendations.recommended_kits.length > 0 && (
                <div>
                  <h3 
                    className="text-2xl font-bold mb-4 flex items-center gap-2"
                    style={{ color: NATURE.sage[900] }}
                  >
                    🎒 Recommended Gear Kits
                  </h3>
                  
                  <div className="grid gap-4">
                    {recommendations.recommended_kits.map((kit) => (
                      <div 
                        key={kit.id} 
                        className="p-5 rounded-xl border-2 transition-all hover:shadow-lg"
                        style={{
                          backgroundColor: kit.priority === 'essential' 
                            ? '#FEF2F2' 
                            : kit.priority === 'recommended'
                            ? NATURE.sage[50]
                            : '#F0FDF4',
                          borderColor: kit.priority === 'essential'
                            ? '#FECACA'
                            : kit.priority === 'recommended'
                            ? NATURE.sage[200]
                            : '#BBF7D0',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span 
                                className="text-lg font-bold"
                                style={{ color: NATURE.sage[900] }}
                              >
                                {kit.name}
                              </span>
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: kit.priority === 'essential'
                                    ? '#FECACA'
                                    : kit.priority === 'recommended'
                                    ? NATURE.sage[200]
                                    : '#BBF7D0',
                                  color: kit.priority === 'essential'
                                    ? '#991B1B'
                                    : kit.priority === 'recommended'
                                    ? NATURE.sage[800]
                                    : '#166534',
                                }}
                              >
                                {kit.priority?.toUpperCase() || 'RECOMMENDED'}
                              </span>
                            </div>
                            <p style={{ color: NATURE.sage[700] }}>
                              {kit.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Reserve Button for this kit */}
                        <button
                          onClick={() => handleReserveKit(kit.name)}
                          className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
                          style={{
                            backgroundColor: NATURE.sage[500],
                            color: 'white',
                          }}
                        >
                          Find Similar Gear
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back Button */}
              <button
                onClick={() => {
                  setRecommendations(null);
                  setDestination('');
                  setStartDate('');
                  setDuration('');
                }}
                className="w-full py-3 rounded-xl font-semibold transition border-2"
                style={{ 
                  borderColor: NATURE.sage[300],
                  color: NATURE.sage[700],
                  backgroundColor: 'white',
                }}
              >
                ← Plan Another Trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}