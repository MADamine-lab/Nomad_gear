import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cookie utilities
export const cookies = {
  get: (name: string): string | null => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  },

  set: (name: string, value: string, options: { expires?: Date; path?: string; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' } = {}) => {
    let cookie = `${name}=${value}`

    if (options.expires) {
      cookie += `; expires=${options.expires.toUTCString()}`
    }

    if (options.path) {
      cookie += `; path=${options.path}`
    } else {
      cookie += '; path=/'
    }

    if (options.secure) {
      cookie += '; secure'
    }

    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`
    }

    document.cookie = cookie
  },

  remove: (name: string, path: string = '/') => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
  }
}
