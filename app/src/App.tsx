import React, { useState, useEffect } from 'react'
import './App.css'
import { 
  Tent, 
  Flame, 
  Lamp, 
  CheckCircle2, 
  Shield, 
  Calendar, 
  Package,
  Star,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  Mail,
  Instagram,
  Twitter,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Leaf
} from 'lucide-react'
import { GearListComponent } from './components/GearListComponent'
import { ReservationModal } from './components/ReservationModal'
import { LoginPrompt } from './components/LoginPrompt'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './hooks/useApi'
import GearRecommendation from './components/GearRecommendation'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  
  // Auth state
  const { user, login, logout } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  // Reservation state
  const [selectedGear, setSelectedGear] = useState<any>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  
  const [showRecommendation, setShowRecommendation] = useState(false)
  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])


  useEffect(() => {
    const handleScroll = () => {  
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }
  
  const handleRecommendationReserve = (kitName: string) => {
  // Scroll to gear section and optionally filter
  scrollToSection('gear')
  // You could also set a filter based on the kit name
  }

  const handleReserveClick = (gear: any) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
    } else {
      setSelectedGear(gear)
      setShowReservationModal(true)
    }
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowReservationModal(true)
  }

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
  }

  // Static gear kits for reference - actual data comes from API in GearListComponent
  const gearKits = [
    { id: 1, name: 'Weekend Light Kit', desc: 'Sleep system + bag', price: '87', image: '/images/kit_sleep_system.jpg', category: 'Backpacking' },
    { id: 2, name: 'Trail Cook Set', desc: 'Stove + cookware', price: '54', image: '/images/kit_cookset.jpg', category: 'Backpacking' },
    { id: 3, name: 'Alpine Shelter', desc: 'Tent + footprint', price: '96', image: '/images/kit_tent.jpg', category: 'Backpacking' },
    { id: 4, name: 'Night Light Kit', desc: 'Lantern + headlamp', price: '36', image: '/images/kit_lighting.jpg', category: 'All' },
    { id: 5, name: 'Family Basecamp', desc: 'Large tent + chairs', price: '165', image: '/images/kit_family.jpg', category: 'Family' },
    { id: 6, name: 'Bikepacking Bundle', desc: 'Bags + compact tent', price: '126', image: '/images/kit_bikepacking.jpg', category: 'Bikepacking' },
  ]

  const filteredKits = activeFilter === 'All' 
    ? gearKits 
    : gearKits.filter(kit => kit.category === activeFilter || kit.category === 'All')

  const destinations = [
    { name: 'ALPINE LAKE', image: '/images/polaroid_alpine_lake.jpg', rotate: '-2deg' },
    { name: 'FOREST RIDGE', image: '/images/polaroid_forest_ridge.jpg', rotate: '6deg' },
    { name: 'DESERT CAMP', image: '/images/polaroid_desert_camp.jpg', rotate: '4deg' },
    { name: 'COASTAL BLUFF', image: '/images/polaroid_coastal_bluff.jpg', rotate: '-6deg' },
  ]

  // Add-ons with Tunisian Dinar prices
  const addOns = [
    { name: 'Camp Kitchen Set', price: '36', icon: Flame },
    { name: 'LED Lantern + Power Bank', price: '24', icon: Lamp },
    { name: 'Insulated Sleeping Pad', price: '30', icon: Package },
  ]

  const reviews = [
    { text: 'Everything worked perfectly. The tent was set up in five minutes.', author: 'Ahmed B.', rating: 5 },
    { text: 'Clean, lightweight, and the guide was really useful.', author: 'Sarra K.', rating: 5 },
    { text: 'Cheaper than buying—and zero storage problems at home.', author: 'Karim J.', rating: 5 },
  ]

  const valueProps = [
    { title: 'Cleaned & Inspected', desc: 'Every piece after every trip.', icon: CheckCircle2 },
    { title: 'Lightweight Kits', desc: 'Packed for easy transport.', icon: Package },
    { title: 'Flexible Dates', desc: 'Modify or cancel up to 48h before.', icon: Calendar },
    { title: 'Fair Coverage', desc: 'Simple protection, no hidden fees.', icon: Shield },
  ]

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-offwhite">
      {/* Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-sage-900/95 backdrop-blur-md py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="w-full px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollToSection('hero')} className="font-heading font-bold text-xl tracking-wider text-white">
            NOMAD GEAR
          </button>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            <button onClick={() => scrollToSection('gear')} className="nav-link">Kits</button>
            <button onClick={() => scrollToSection('destinations')} className="nav-link">Destinations</button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link">How It Works</button>
            <button onClick={() => scrollToSection('reviews')} className="nav-link">Reviews</button>
            <button onClick={() => scrollToSection('footer')} className="nav-link">FAQ</button>
            <button 
              onClick={() => setShowRecommendation(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Leaf size={18} />
              AI Gear Advisor
            </button> 
          </div>
          
          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-white text-sm">
                  <span>{user?.username || 'User'}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-xs font-semibold flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowLoginPrompt(true)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-xs font-semibold flex items-center gap-2"
                >
                  <UserIcon size={16} /> Login
                </button>
                <button onClick={() => scrollToSection('gear')} className="btn-primary text-xs py-3 px-6">
                  Reserve
                </button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-sage-900/98 backdrop-blur-md py-8 px-6">
            <div className="flex flex-col gap-6">
              <button onClick={() => scrollToSection('gear')} className="nav-link text-left text-lg">Kits</button>
              <button onClick={() => scrollToSection('destinations')} className="nav-link text-left text-lg">Destinations</button>
              <button onClick={() => scrollToSection('how-it-works')} className="nav-link text-left text-lg">How It Works</button>
              <button onClick={() => scrollToSection('reviews')} className="nav-link text-left text-lg">Reviews</button>
              <button onClick={() => scrollToSection('footer')} className="nav-link text-left text-lg">FAQ</button>
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-white/70 text-sm mb-2">Logged in as: {user?.username || 'User'}</p>
                    <button 
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left nav-link text-lg flex items-center gap-2 text-red-400"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setShowLoginPrompt(true)
                      setMobileMenuOpen(false)
                    }}
                    className="nav-link text-left text-lg flex items-center gap-2"
                  >
                    <UserIcon size={18} /> Login
                  </button>
                </>
              )}
              
              <button onClick={() => scrollToSection('gear')} className="btn-primary mt-4">
                Reserve
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/images/hero_lakeside.jpg" 
            alt="Tent by an alpine lake" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 vignette-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
        </div>
        
        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-heading font-extrabold text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-wider text-shadow-hero mb-6 animate-fade-in-up">
            Rent Nature
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Premium camping kits delivered to your starting point.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button onClick={() => scrollToSection('gear')} className="btn-primary">
              Reserve
            </button>
            <button 
              onClick={() => scrollToSection('destinations')} 
              className="font-label text-sm uppercase tracking-widest text-white/90 hover:text-white flex items-center gap-2 transition-colors"
            >
              View Destinations <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 hidden md:block">
          <span className="font-label text-xs uppercase tracking-widest text-white/70">Scroll</span>
        </div>
      </section>

      {/* Featured Kit Section */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src="/images/featured_tent_bg.jpg" 
            alt="Tent in forest" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        {/* Content */}
        <div className="relative min-h-screen flex items-center px-6 lg:px-16 py-24">
          <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Card */}
            <div className="bg-offwhite/95 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-card-lg border border-sage-200">
              <span className="inline-block font-label text-xs uppercase tracking-widest text-ochre mb-4">
                Featured Kit
              </span>
              <h2 className="font-heading font-bold text-3xl lg:text-5xl uppercase tracking-wide text-sage-900 mb-6">
                The Summit Tent
              </h2>
              <p className="text-sage-700 text-lg leading-relaxed mb-8">
                Spacious dome for 3 people, waterproof up to 3000mm, setup in 5 minutes. Perfect for alpine lakes and forest clearings.
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-heading font-bold text-2xl text-sage-900">From 114 TND</span>
                <span className="text-sage-600">/night</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => scrollToSection('gear')} className="btn-primary">
                  Add to Reservation
                </button>
                <button className="font-label text-sm uppercase tracking-widest text-sage-700 hover:text-sage-900 flex items-center gap-2 transition-colors">
                  View Specifications <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="hidden lg:flex justify-center">
              <img 
                src="/images/featured_tent.png" 
                alt="Summit Tent" 
                className="max-w-md w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gear Grid Section */}
      <section id="gear" className="section-light py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase tracking-wide text-sage-900 mb-4">
                Choose Your Kit
              </h2>
              <p className="text-sage-700 text-lg max-w-xl">
                All equipment is cleaned, inspected, and packed with setup guides.
              </p>
            </div>
          </div>
          
          {/* API-Connected Gear List */}
          <GearListComponent onReserveClick={handleReserveClick} />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-dark py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase tracking-wide mb-4">
              How It Works
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Reserve online. Pick up at a hub or get delivered. Return when you're done.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Reserve', desc: 'Choose dates, add extras, confirm in two minutes.', icon: Calendar },
              { step: '02', title: 'Camp', desc: 'Pickup or delivery. Everything packs into one bag.', icon: Tent },
              { step: '03', title: 'Return', desc: 'Drop off or schedule pickup. No cleaning required.', icon: Package },
            ].map((item, index) => (
              <div 
                key={index} 
                className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-colors duration-300"
              >
                <div className="w-16 h-16 bg-ochre/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="text-ochre" size={28} />
                </div>
                <span className="font-label text-xs uppercase tracking-widest text-ochre mb-3 block">
                  Step {item.step}
                </span>
                <h3 className="font-heading font-bold text-2xl uppercase tracking-wide mb-4">
                  {item.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Inspiration Section */}
      <section id="destinations" className="section-light py-24 px-6 lg:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase tracking-wide text-sage-900 mb-4">
                Destination Inspiration
              </h2>
              <p className="text-sage-700 text-lg max-w-xl">
                Campgrounds, trails, and alpine lakes—selected for the season.
              </p>
            </div>
            <button 
              onClick={() => scrollToSection('gear')} 
              className="font-label text-sm uppercase tracking-widest text-sage-700 hover:text-sage-900 flex items-center gap-2 transition-colors"
            >
              Explore Campgrounds <ArrowRight size={16} />
            </button>
          </div>
          
          {/* Horizontal Scrolling Polaroids */}
          <div className="scroll-container overflow-x-auto pb-6 -mx-6 px-6">
            <div className="flex gap-6 min-w-max">
              {destinations.map((dest, index) => (
                <div 
                  key={index} 
                  className="polaroid flex-shrink-0 w-64 md:w-72 transition-transform duration-300 hover:-translate-y-2"
                  style={{ transform: `rotate(${dest.rotate})` }}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={dest.image} 
                      alt={dest.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="polaroid-caption">{dest.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add-Ons Section */}
      <section className="section-light py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-card-lg">
                <img 
                  src="/images/addons_kitchen.jpg" 
                  alt="Camping kitchen" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            
            {/* Right Content */}
            <div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase tracking-wide text-sage-900 mb-4">
                Add Extras
              </h2>
              <p className="text-sage-700 text-lg mb-8">
                Upgrade your kit with cooking gear, lighting, and comfort items.
              </p>
              
              <div className="space-y-4 mb-8">
                {addOns.map((addon, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-card hover:shadow-card-lg transition-shadow duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center group-hover:bg-ochre/20 transition-colors">
                        <addon.icon className="text-sage-600 group-hover:text-ochre transition-colors" size={22} />
                      </div>
                      <span className="font-heading font-semibold text-sage-900">{addon.name}</span>
                    </div>
                    <span className="font-heading font-bold text-sage-900">{addon.price} TND<span className="text-sm font-normal text-sage-600">/night</span></span>
                  </div>
                ))}
              </div>
              
              <button onClick={() => scrollToSection('gear')} className="btn-primary">
                Add to Reservation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="section-light py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase tracking-wide text-sage-900 mb-4">
              Built for Real Adventures
            </h2>
            <p className="text-sage-700 text-lg">
              Rated 4.9/5 by hikers, families, and weekend travelers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <div 
                key={index} 
                className="bg-white rounded-3xl p-8 shadow-card hover:shadow-card-lg transition-shadow duration-300"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="fill-ochre text-ochre" size={18} />
                  ))}
                </div>
                <p className="text-sage-800 text-lg leading-relaxed mb-6">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sage-200 rounded-full flex items-center justify-center">
                    <span className="font-heading font-bold text-sage-700 text-sm">
                      {review.author.split(' ')[0][0]}
                    </span>
                  </div>
                  <span className="font-label text-sm uppercase tracking-widest text-sage-600">
                    {review.author}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="section-light py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl lg:text-5xl uppercase tracking-wide text-sage-900 mb-4">
              Why Rent with Nomad
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((prop, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <prop.icon className="text-sage-700" size={28} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-sage-900 mb-2">
                  {prop.title}
                </h3>
                <p className="text-sage-600 text-sm">
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section-dark py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="font-heading font-bold text-4xl lg:text-6xl uppercase tracking-wide mb-6">
                Ready to Go?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-md">
                Reserve your kit now. Pickup or delivery—your choice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => scrollToSection('gear')} className="btn-primary">
                  Reserve
                </button>
                <button className="font-label text-sm uppercase tracking-widest text-white/70 hover:text-white flex items-center gap-2 transition-colors">
                  Ask a Question <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-card-lg">
                <img 
                  src="/images/final_cta_forest.jpg" 
                  alt="Forest trail" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="section-light py-16 px-6 lg:px-16 border-t border-sage-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <h3 className="font-heading font-bold text-2xl tracking-wider text-sage-900 mb-4">
                NOMAD GEAR
              </h3>
              <p className="text-sage-600 mb-4">
                hello@nomadgear.tn
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">
                  <Mail size={20} />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-label text-xs uppercase tracking-widest text-sage-900 mb-4">Rent</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('gear')} className="text-sage-600 hover:text-sage-900 transition-colors">Kits</button></li>
                <li><button onClick={() => scrollToSection('destinations')} className="text-sage-600 hover:text-sage-900 transition-colors">Destinations</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="text-sage-600 hover:text-sage-900 transition-colors">How It Works</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-label text-xs uppercase tracking-widest text-sage-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">About</a></li>
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">Careers</a></li>
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-label text-xs uppercase tracking-widest text-sage-900 mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">FAQ</a></li>
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">Contact</a></li>
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">Terms</a></li>
                <li><a href="#" className="text-sage-600 hover:text-sage-900 transition-colors">Privacy</a></li>
                <li>
                  <button 
                    className="text-ochre hover:text-ochre-dark transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="border-t border-sage-200 pt-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <p className="text-sage-600">
                Get travel notes + new kits.
              </p>
              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-5 py-3 bg-white border border-sage-200 rounded-xl text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-ochre/50 w-64"
                />
                <button className="btn-primary py-3">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-sage-500 text-sm">
            © Nomad Gear Tunisia. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginPrompt 
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
      />
      <GearRecommendation
        isOpen={showRecommendation}
        onClose={() => setShowRecommendation(false)}
        onReserveClick={handleRecommendationReserve}
      />
      <ReservationModal
        gear={selectedGear}
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false)
          setSelectedGear(null)
        }}
        isAuthenticated={isAuthenticated}
        onLoginRequired={() => {
          setShowReservationModal(false)
          setShowLoginPrompt(true)
        }}
      />
    </div>
    </ErrorBoundary>
  )
}

export default App