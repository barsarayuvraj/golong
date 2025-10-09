// Temporary mock Supabase client for development
export const createClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ error: null }),
    signInWithOAuth: async ({ provider }: { provider: string }) => {
      // Mock OAuth flow - in real app this would redirect to provider
      console.log(`Mock OAuth sign in with ${provider}`)
      return { error: null }
    },
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
  from: () => ({
    insert: () => ({ error: null }),
    select: () => ({ data: [], error: null }),
    update: () => ({ error: null }),
    delete: () => ({ error: null }),
  }),
})
