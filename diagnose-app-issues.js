// Diagnose Application Issues
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzM5NTUsImV4cCI6MjA3NTk0OTk1NX0.cOdq0tVwyIwDU1fjvE3iUG7qAl-UitXnHX_QXeWcZmI';

async function diagnoseAppIssues() {
    console.log('🔍 Diagnosing application issues...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test 1: Basic connection
    console.log('\n📡 Test 1: Basic connection');
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
            console.log('❌ Basic connection failed:', error.message);
        } else {
            console.log('✅ Basic connection successful');
        }
    } catch (err) {
        console.log('❌ Basic connection error:', err.message);
    }
    
    // Test 2: Check current session
    console.log('\n🔐 Test 2: Current session');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        console.log('✅ User is authenticated:', session.user.email);
        console.log('User ID:', session.user.id);
        
        // Test 3: Check if profile exists for current user
        console.log('\n👤 Test 3: Profile lookup');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
        if (profileError) {
            console.log('❌ Profile lookup failed:', profileError.message);
        } else if (profile) {
            console.log('✅ Profile found:', profile.username);
        } else {
            console.log('⚠️ No profile found for user');
        }
    } else {
        console.log('⚠️ No active session - user not authenticated');
    }
    
    // Test 4: Test Realtime subscription
    console.log('\n🔄 Test 4: Realtime subscription');
    const channel = supabase
        .channel('test-channel')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles' },
            (payload) => {
                console.log('📨 Realtime event received:', payload);
            }
        )
        .subscribe((status) => {
            console.log('📡 Realtime subscription status:', status);
        });
    
    // Wait a bit then unsubscribe
    setTimeout(() => {
        supabase.removeChannel(channel);
        console.log('🔌 Realtime subscription closed');
    }, 3000);
}

diagnoseAppIssues().catch(console.error);
