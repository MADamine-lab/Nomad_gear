// ReservationModal.tsx
import { useState, useEffect } from 'react'
import { 
  X, 
  Loader, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Package,
  Flame,
  Lamp,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  Shield,
  Truck,
  ChevronRight
} from 'lucide-react'

interface GearItem {
  id: number
  name: string
  description: string
  daily_price: number
  weekly_price?: number
  monthly_price?: number
}

interface AddOnItem {
  id: string
  name: string
  price: number
  icon: React.ElementType
  quantity: number
}

interface ReservationModalProps {
  gear: GearItem | null
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
  onLoginRequired?: () => void
}

// Nature color palette
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
  white: '#FFFFFF',
}

// Available add-ons
const AVAILABLE_ADDONS: Omit<AddOnItem, 'quantity'>[] = [
  { id: 'kitchen_set', name: 'Camp Kitchen Set', price: 36, icon: Flame },
  { id: 'lantern_power', name: 'LED Lantern + Power Bank', price: 24, icon: Lamp },
  { id: 'sleeping_pad', name: 'Insulated Sleeping Pad', price: 30, icon: Package },
]

// Payment methods configuration
const PAYMENT_METHODS = [
  {
    id: 'stripe',
    name: 'Credit/Debit Card',
    description: 'Pay securely with Stripe',
    icon: CreditCard,
    color: '#635BFF',
    available: true,
  },
  {
    id: 'flouci',
    name: 'Flouci (Tunisia)',
    description: 'Pay with D17, e-dinars, or card',
    icon: Smartphone,
    color: '#00A86B',
    available: true,
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    description: 'Pay when you receive (+5 TND fee)',
    icon: Banknote,
    color: NATURE.sage[600],
    available: true,
  },
]

// API base URL
const API_URL = 'http://127.0.0.1:8000/api'

export function ReservationModal({
  gear,
  isOpen,
  onClose,
  isAuthenticated,
  onLoginRequired,
}: ReservationModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details')
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    quantity: 1,
    delivery_address: '',
    delivery_city: '',
    delivery_postal_code: '',
    delivery_country: 'Tunisia',
  })

  const [addOns, setAddOns] = useState<AddOnItem[]>(
    AVAILABLE_ADDONS.map(addon => ({ ...addon, quantity: 0 }))
  )

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('stripe')
  const [availability, setAvailability] = useState<any>(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [addOnsTotal, setAddOnsTotal] = useState(0)
  const [codFee, setCodFee] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [createdOrder, setCreatedOrder] = useState<any>(null)

  // Calculate dates, availability, and prices
  useEffect(() => {
    if (!formData.start_date || !formData.end_date || !gear) {
      setAvailability(null)
      setTotalPrice(0)
      setAddOnsTotal(0)
      setCodFee(0)
      return
    }

    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)

    if (endDate <= startDate) {
      setAvailability(null)
      setTotalPrice(0)
      setAddOnsTotal(0)
      setCodFee(0)
      return
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate gear price
    let gearPrice = gear.daily_price * days * formData.quantity
    if (days >= 7 && gear.weekly_price) {
      gearPrice = (gear.weekly_price * Math.floor(days / 7) + gear.daily_price * (days % 7)) * formData.quantity
    }
    if (days >= 30 && gear.monthly_price) {
      gearPrice = (gear.monthly_price * Math.floor(days / 30) + gear.daily_price * (days % 30)) * formData.quantity
    }

    // Calculate add-ons price
    const addonsPrice = addOns.reduce((total, addon) => {
      return total + (addon.price * addon.quantity * days)
    }, 0)

    // Calculate COD fee
    const codFeeAmount = selectedPaymentMethod === 'cash' ? 5 : 0

    setTotalPrice(gearPrice)
    setAddOnsTotal(addonsPrice)
    setCodFee(codFeeAmount)
    setAvailability({ available: true, days })
  }, [formData.start_date, formData.end_date, formData.quantity, gear, addOns, selectedPaymentMethod])

  const updateAddOnQuantity = (addonId: string, delta: number) => {
    setAddOns(prev => prev.map(addon => {
      if (addon.id === addonId) {
        const newQuantity = Math.max(0, addon.quantity + delta)
        return { ...addon, quantity: newQuantity }
      }
      return addon
    }))
  }

  const getSelectedAddOns = () => {
    return addOns.filter(addon => addon.quantity > 0).map(addon => ({
      addon_id: addon.id,
      name: addon.name,
      price: addon.price,
      quantity: addon.quantity
    }))
  }

  const createOrder = async () => {
    const token = localStorage.getItem('access_token')
    
    const orderData = {
      gear: gear?.id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      quantity: formData.quantity,
      delivery_address: formData.delivery_address,
      delivery_city: formData.delivery_city,
      delivery_postal_code: formData.delivery_postal_code,
      delivery_country: formData.delivery_country,
      special_requests: '',
      insurance_selected: false,
    }

    const response = await fetch(`${API_URL}/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error('Failed to create order')
    }

    return await response.json()
  }

  const processStripePayment = async (orderId: number) => {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${API_URL}/orders/payments/create_stripe_payment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    })

    if (!response.ok) {
      throw new Error('Failed to create Stripe payment')
    }

    const data = await response.json()
    
    // Load Stripe.js
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key')
    
    if (!stripe) {
      throw new Error('Stripe failed to load')
    }

    // Confirm payment
    const { error } = await stripe.confirmPayment({
      clientSecret: data.client_secret,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Confirm payment on backend
    await fetch(`${API_URL}/orders/payments/confirm_stripe_payment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ payment_intent_id: data.payment_intent_id }),
    })

    return data
  }

  const processFlouciPayment = async (orderId: number) => {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${API_URL}/orders/payments/create_flouci_payment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    })

    if (!response.ok) {
      throw new Error('Failed to create Flouci payment')
    }

    const data = await response.json()
    
    // Redirect to Flouci payment page
    if (data.payment_url) {
      window.location.href = data.payment_url
    } else {
      throw new Error('No payment URL received')
    }

    return data
  }

  const processCODOrder = async (orderId: number) => {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${API_URL}/orders/payments/create_cod_order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    })

    if (!response.ok) {
      throw new Error('Failed to create COD order')
    }

    return await response.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setErrorMessage('Please login to reserve gear')
      onLoginRequired?.()
      return
    }

    if (!availability?.available) {
      setErrorMessage('This item is not available for the selected dates')
      return
    }

    if (!formData.delivery_address || !formData.delivery_city) {
      setErrorMessage('Please fill in all delivery information')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Step 1: Create order
      const order = await createOrder()
      setCreatedOrder(order)

      // Step 2: Process payment based on method
      if (selectedPaymentMethod === 'stripe') {
        await processStripePayment(order.id)
      } else if (selectedPaymentMethod === 'flouci') {
        await processFlouciPayment(order.id)
        return // Redirect happens in function
      } else if (selectedPaymentMethod === 'cash') {
        await processCODOrder(order.id)
      }

      setStep('success')
      setSuccessMessage(`✓ Reservation confirmed! Order #${order.order_number}`)
      
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to process reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueToPayment = () => {
    if (!formData.start_date || !formData.end_date || !formData.delivery_address || !formData.delivery_city) {
      setErrorMessage('Please fill in all required fields')
      return
    }
    setStep('payment')
    setErrorMessage('')
  }

  // Reset when modal opens with new gear
  useEffect(() => {
    if (isOpen && gear) {
      setStep('details')
      setAddOns(AVAILABLE_ADDONS.map(addon => ({ ...addon, quantity: 0 })))
      setAvailability(null)
      setTotalPrice(0)
      setAddOnsTotal(0)
      setCodFee(0)
      setSelectedPaymentMethod('stripe')
      setCreatedOrder(null)
      setErrorMessage('')
      setSuccessMessage('')
    }
  }, [isOpen, gear?.id])

  if (!isOpen || !gear) return null

  const grandTotal = totalPrice + addOnsTotal + codFee
  const hasAddOns = addOns.some(addon => addon.quantity > 0)

  // Stripe loader
  const loadStripe = async (key: string) => {
    const { loadStripe } = await import('@stripe/stripe-js')
    return loadStripe(key)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: NATURE.cream }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 text-white p-6 flex justify-between items-center z-10"
          style={{ 
            background: `linear-gradient(135deg, ${NATURE.sage[600]} 0%, ${NATURE.sage[500]} 50%, ${NATURE.ochre.DEFAULT} 100%)` 
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{gear.name}</h2>
              <p className="text-white/90 text-sm font-medium">
                {gear.daily_price} TND/day • {step === 'payment' ? 'Payment' : 'Reservation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm"
          >
            <X size={24} />
          </button>
        </div>

        {step === 'success' ? (
          /* Success View */
          <div className="p-12 text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: NATURE.sage[100] }}
            >
              <CheckCircle size={40} style={{ color: NATURE.sage[600] }} />
            </div>
            <h3 
              className="text-2xl font-bold mb-4"
              style={{ color: NATURE.sage[800] }}
            >
              Reservation Confirmed!
            </h3>
            <p className="text-lg mb-2" style={{ color: NATURE.sage[600] }}>
              {successMessage}
            </p>
            <p className="text-sm mb-8" style={{ color: NATURE.sage[500] }}>
              {selectedPaymentMethod === 'cash' 
                ? 'Pay cash when you receive your gear.' 
                : 'Payment completed successfully.'}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
              style={{ backgroundColor: NATURE.sage[500] }}
            >
              Done
            </button>
          </div>
        ) : step === 'payment' ? (
          /* Payment Step */
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div 
              className="p-4 rounded-xl border-2"
              style={{ backgroundColor: NATURE.sage[50], borderColor: NATURE.sage[200] }}
            >
              <h3 className="font-bold mb-3" style={{ color: NATURE.sage[800] }}>
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: NATURE.sage[600] }}>Gear Rental:</span>
                  <span style={{ color: NATURE.sage[800] }}>{totalPrice.toFixed(2)} TND</span>
                </div>
                {hasAddOns && (
                  <div className="flex justify-between">
                    <span style={{ color: NATURE.sage[600] }}>Add-ons:</span>
                    <span style={{ color: NATURE.sage[800] }}>{addOnsTotal.toFixed(2)} TND</span>
                  </div>
                )}
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: NATURE.sage[600] }}>COD Fee:</span>
                    <span style={{ color: NATURE.sage[800] }}>{codFee.toFixed(2)} TND</span>
                  </div>
                )}
                <div 
                  className="border-t pt-2 mt-2 flex justify-between font-bold text-lg"
                  style={{ borderColor: NATURE.sage[300] }}
                >
                  <span style={{ color: NATURE.sage[800] }}>Total:</span>
                  <span style={{ color: NATURE.ochre.dark }}>{grandTotal.toFixed(2)} TND</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h3 
                className="font-bold text-lg flex items-center gap-2"
                style={{ color: NATURE.sage[800] }}
              >
                <CreditCard size={20} />
                Select Payment Method
              </h3>
              
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon
                  const isSelected = selectedPaymentMethod === method.id
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className="w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4"
                      style={{
                        backgroundColor: isSelected ? NATURE.sage[50] : NATURE.white,
                        borderColor: isSelected ? method.color : NATURE.sage[200],
                      }}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: isSelected ? method.color : NATURE.sage[100] }}
                      >
                        <Icon 
                          size={24} 
                          style={{ color: isSelected ? 'white' : NATURE.sage[600] }} 
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold" style={{ color: NATURE.sage[900] }}>
                          {method.name}
                        </p>
                        <p className="text-sm" style={{ color: NATURE.sage[600] }}>
                          {method.description}
                        </p>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: isSelected ? method.color : NATURE.sage[300],
                          backgroundColor: isSelected ? method.color : 'transparent',
                        }}
                      >
                        {isSelected && <CheckCircle size={16} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Security Note */}
            <div 
              className="p-4 rounded-xl flex items-center gap-3"
              style={{ backgroundColor: NATURE.sage[50] }}
            >
              <Shield size={20} style={{ color: NATURE.sage[600] }} />
              <p className="text-sm" style={{ color: NATURE.sage[600] }}>
                Your payment is secured with {selectedPaymentMethod === 'stripe' ? 'Stripe' : selectedPaymentMethod === 'flouci' ? 'Flouci' : 'our trusted delivery partners'}
              </p>
            </div>

            {/* Error/Success Messages */}
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl flex gap-2">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-4 rounded-xl font-semibold transition"
                style={{ 
                  backgroundColor: NATURE.sage[100],
                  color: NATURE.sage[700],
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ 
                  background: `linear-gradient(135deg, ${NATURE.sage[500]} 0%, ${NATURE.sage[600]} 100%)`,
                  color: 'white',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🌲</span>
                    Pay {grandTotal.toFixed(2)} TND
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Details Step */
          <form onSubmit={(e) => { e.preventDefault(); handleContinueToPayment(); }} className="p-6 space-y-5">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: NATURE.sage[700] }}
                >
                  <Calendar size={16} />
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition"
                  style={{ borderColor: NATURE.sage[200], backgroundColor: NATURE.white }}
                  onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                  onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                />
              </div>
              <div className="space-y-2">
                <label 
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: NATURE.sage[700] }}
                >
                  <Calendar size={16} />
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition"
                  style={{ borderColor: NATURE.sage[200], backgroundColor: NATURE.white }}
                  onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                  onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label 
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: NATURE.sage[700] }}
              >
                <Package size={16} />
                Quantity *
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                  className="w-10 h-10 rounded-full font-bold text-lg transition hover:scale-110"
                  style={{ backgroundColor: NATURE.sage[100], color: NATURE.sage[700] }}
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-20 text-center rounded-xl px-3 py-2 border-2 font-bold text-lg"
                  style={{ borderColor: NATURE.sage[300], backgroundColor: NATURE.white, color: NATURE.sage[800] }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: Math.min(10, formData.quantity + 1) })}
                  className="w-10 h-10 rounded-full font-bold text-lg transition hover:scale-110"
                  style={{ backgroundColor: NATURE.sage[100], color: NATURE.sage[700] }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Availability Status */}
            {availability && (
              <div
                className="p-4 rounded-xl flex gap-3 border-2"
                style={{
                  backgroundColor: availability.available ? NATURE.sage[50] : '#FEF2F2',
                  borderColor: availability.available ? NATURE.sage[200] : '#FECACA',
                }}
              >
                {availability.available ? (
                  <>
                    <div className="p-2 rounded-full" style={{ backgroundColor: NATURE.sage[100] }}>
                      <CheckCircle style={{ color: NATURE.sage[600] }} size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: NATURE.sage[800] }}>Available! 🌿</p>
                      <p className="text-sm" style={{ color: NATURE.sage[600] }}>
                        {availability.days} days • Gear: <span className="font-bold" style={{ color: NATURE.ochre.dark }}>{totalPrice.toFixed(2)} TND</span>
                        {hasAddOns && (
                          <span> • Add-ons: <span className="font-bold" style={{ color: NATURE.ochre.dark }}>{addOnsTotal.toFixed(2)} TND</span></span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertCircle className="text-red-600" size={20} />
                    </div>
                    <p className="text-red-800 font-semibold">Not available for these dates</p>
                  </>
                )}
              </div>
            )}

            {/* Add Extras Section */}
            <div className="space-y-3">
              <h3 
                className="font-bold text-lg flex items-center gap-2"
                style={{ color: NATURE.sage[800] }}
              >
                <Flame size={20} />
                Add Extras
              </h3>
              <p className="text-sm" style={{ color: NATURE.sage[600] }}>
                Upgrade your adventure with these essentials
              </p>
              
              <div className="space-y-3">
                {addOns.map((addon) => {
                  const Icon = addon.icon
                  return (
                    <div 
                      key={addon.id}
                      className="flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                      style={{
                        backgroundColor: addon.quantity > 0 ? NATURE.sage[50] : NATURE.white,
                        borderColor: addon.quantity > 0 ? NATURE.sage[300] : NATURE.sage[200],
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: addon.quantity > 0 ? NATURE.ochre.light : NATURE.sage[100] }}
                        >
                          <Icon 
                            size={22} 
                            style={{ color: addon.quantity > 0 ? NATURE.ochre.dark : NATURE.sage[600] }} 
                          />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: NATURE.sage[900] }}>{addon.name}</p>
                          <p className="text-sm" style={{ color: NATURE.sage[600] }}>{addon.price} TND/night</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateAddOnQuantity(addon.id, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition"
                          style={{ 
                            backgroundColor: NATURE.sage[100],
                            color: NATURE.sage[700],
                            opacity: addon.quantity > 0 ? 1 : 0.5
                          }}
                          disabled={addon.quantity === 0}
                        >
                          <Minus size={16} />
                        </button>
                        <span 
                          className="w-8 text-center font-bold"
                          style={{ color: NATURE.sage[800] }}
                        >
                          {addon.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateAddOnQuantity(addon.id, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                          style={{ backgroundColor: NATURE.sage[500], color: 'white' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <label 
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: NATURE.sage[700] }}
              >
                <Truck size={16} />
                Delivery Address *
              </label>
              <input
                type="text"
                required
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                placeholder="123 Forest Lane"
                className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition"
                style={{ borderColor: NATURE.sage[200], backgroundColor: NATURE.white }}
                onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
              />
            </div>

            {/* City, Postal, Country */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'delivery_city', label: 'City', placeholder: 'Tunis' },
                { key: 'delivery_postal_code', label: 'Postal', placeholder: '1000' },
                { key: 'delivery_country', label: 'Country', placeholder: 'Tunisia' },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label 
                    className="block text-sm font-semibold"
                    style={{ color: NATURE.sage[700] }}
                  >
                    {field.label} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl px-3 py-2 border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: NATURE.sage[200], backgroundColor: NATURE.white }}
                    onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                    onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                  />
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl flex gap-2">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={!availability?.available}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02]"
              style={{ 
                background: `linear-gradient(135deg, ${NATURE.sage[500]} 0%, ${NATURE.sage[600]} 100%)`,
                color: 'white',
              }}
            >
              Continue to Payment
              <ChevronRight size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReservationModal