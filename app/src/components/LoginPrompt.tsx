// LoginPrompt.tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useApi'
import { X, Mail, Lock, Loader, User, Leaf } from 'lucide-react'

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
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
}

export function LoginPrompt({ isOpen, onClose, onSuccess }: LoginPromptProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  })
  const [localError, setLocalError] = useState('')

  const { login, register, loading, error } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    const success = await login(formData.username || formData.email, formData.password)
    if (success) {
      onClose()
      onSuccess?.()
      setFormData({
        email: '',
        username: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
      })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (formData.password !== formData.password_confirm) {
      setLocalError('Passwords do not match')
      return
    }

    const success = await register({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      password_confirm: formData.password_confirm,
      first_name: formData.first_name,
      last_name: formData.last_name,
    })

    if (success) {
      setIsLogin(true)
      setFormData({
        email: '',
        username: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
      })
      setLocalError('Account created! Please log in. 🌿')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ backgroundColor: NATURE.cream }}
      >
        {/* Header - Nature gradient with pattern */}
        <div 
          className="relative text-white p-8 text-center overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${NATURE.sage[600]} 0%, ${NATURE.sage[500]} 50%, ${NATURE.ochre.DEFAULT} 100%)` 
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm"
          >
            <X size={20} />
          </button>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Leaf size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back!' : 'Join the Adventure'}
            </h2>
            <p className="text-white/90 text-sm">
              {isLogin ? 'Login to start your nature journey' : 'Create an account to explore the wild'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={isLogin ? handleLogin : handleRegister}
          className="p-6 space-y-4"
        >
          {/* Login Form */}
          {isLogin ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label 
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: NATURE.sage[700] }}
                >
                  <Mail size={16} />
                  Email or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.username || formData.email}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition pl-11"
                    style={{ 
                      borderColor: NATURE.sage[200],
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                    onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                  />
                  <Mail 
                    size={18} 
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: NATURE.sage[400] }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label 
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: NATURE.sage[700] }}
                >
                  <Lock size={16} />
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 border-2 focus:outline-none transition pl-11"
                    style={{ 
                      borderColor: NATURE.sage[200],
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                    onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                  />
                  <Lock 
                    size={18} 
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: NATURE.sage[400] }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Register Form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-semibold"
                    style={{ color: NATURE.sage[700] }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                    className="w-full rounded-xl px-3 py-2 border-2 focus:outline-none transition"
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
                    className="block text-sm font-semibold"
                    style={{ color: NATURE.sage[700] }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="w-full rounded-xl px-3 py-2 border-2 focus:outline-none transition"
                    style={{ 
                      borderColor: NATURE.sage[200],
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => e.target.style.borderColor = NATURE.sage[400]}
                    onBlur={(e) => e.target.style.borderColor = NATURE.sage[200]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label 
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: NATURE.sage[700] }}
                >
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
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
                  <User size={16} />
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nature_explorer"
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
                  <Lock size={16} />
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
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
                  <Lock size={16} />
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  placeholder="••••••••"
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
          )}

          {/* Error/Info Messages */}
          {(error || localError) && (
            <div 
              className="p-4 rounded-xl text-sm border-2"
              style={{ 
                backgroundColor: localError.includes('created') ? NATURE.sage[50] : '#FEF2F2',
                borderColor: localError.includes('created') ? NATURE.sage[200] : '#FECACA',
                color: localError.includes('created') ? NATURE.sage[800] : '#991B1B',
              }}
            >
              <p className="font-medium">{error || localError}</p>
            </div>
          )}

          {/* Submit Button */}
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
                <Loader className="animate-spin" size={20} />
                Processing...
              </>
            ) : isLogin ? (
              <>
                <span>🌿</span>
                Login to Nature
              </>
            ) : (
              <>
                <span>🌲</span>
                Start Your Journey
              </>
            )}
          </button>

          {/* Toggle Form */}
          <div className="text-center pt-2">
            <p className="text-sm" style={{ color: NATURE.sage[600] }}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setLocalError('')
                }}
                className="font-bold hover:underline ml-1 transition"
                style={{ color: NATURE.ochre.dark }}
              >
                {isLogin ? 'Join us!' : 'Welcome back!'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}