/**
 * Message encryption utilities for GoLong
 * Uses Web Crypto API for client-side encryption/decryption
 */

// Generate a random key for encryption
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

// Export key to string format for storage
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

// Import key from string format
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0))
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
    },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt a message
export async function encryptMessage(message: string, key: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    
    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    // Convert to base64 string
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Error encrypting message:', error)
    throw new Error('Failed to encrypt message')
  }
}

// Decrypt a message
export async function decryptMessage(encryptedMessage: string, key: CryptoKey): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0))
    
    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Error decrypting message:', error)
    throw new Error('Failed to decrypt message')
  }
}

// Generate a shared key for a conversation
// Using a simple approach with SHA-256 hash
export async function generateSharedKey(user1Id: string, user2Id: string): Promise<CryptoKey> {
  try {
    // Create a deterministic key based on user IDs
    const encoder = new TextEncoder()
    const data = encoder.encode(`golong-${user1Id}-${user2Id}-messages`)
    
    // Hash the data to create a 32-byte key
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    
    // Import the hash as an AES key
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      {
        name: 'AES-GCM',
      },
      false,
      ['encrypt', 'decrypt']
    )
    
    return key
  } catch (error) {
    console.error('Error generating shared key:', error)
    // Fallback: generate a random key
    return await generateEncryptionKey()
  }
}

// Message encryption service class
export class MessageEncryption {
  private keyCache: Map<string, CryptoKey> = new Map()
  
  // Get or generate a shared key for a conversation
  async getSharedKey(user1Id: string, user2Id: string): Promise<CryptoKey> {
    const keyId = [user1Id, user2Id].sort().join('-')
    
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!
    }
    
    const key = await generateSharedKey(user1Id, user2Id)
    this.keyCache.set(keyId, key)
    return key
  }
  
  // Encrypt a message for a conversation
  async encryptMessage(message: string, user1Id: string, user2Id: string): Promise<string> {
    const key = await this.getSharedKey(user1Id, user2Id)
    return await encryptMessage(message, key)
  }
  
  // Decrypt a message from a conversation
  async decryptMessage(encryptedMessage: string, user1Id: string, user2Id: string): Promise<string> {
    const key = await this.getSharedKey(user1Id, user2Id)
    return await decryptMessage(encryptedMessage, key)
  }
  
  // Clear key cache (useful for logout)
  clearCache(): void {
    this.keyCache.clear()
  }
}

// Global instance
export const messageEncryption = new MessageEncryption()
