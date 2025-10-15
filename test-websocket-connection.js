// Test WebSocket Connection to Supabase Realtime
const WebSocket = require('ws');

const SUPABASE_URL = 'wss://pepgldetpvaiwawmmxox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzM5NTUsImV4cCI6MjA3NTk0OTk1NX0.cOdq0tVwyIwDU1fjvE3iUG7qAl-UitXnHX_QXeWcZmI';

async function testWebSocketConnection() {
    console.log('🔍 Testing WebSocket connection to Supabase Realtime...');
    
    const wsUrl = `${SUPABASE_URL}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    console.log('📡 Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', function open() {
        console.log('✅ WebSocket connection opened successfully!');
        
        // Send a test message to subscribe to profiles table
        const subscribeMessage = {
            topic: 'realtime:public:profiles',
            event: 'phx_join',
            payload: {},
            ref: '1'
        };
        
        ws.send(JSON.stringify(subscribeMessage));
        console.log('📤 Sent subscription message for profiles table');
        
        // Close connection after 5 seconds
        setTimeout(() => {
            ws.close();
            console.log('🔌 WebSocket connection closed');
            process.exit(0);
        }, 5000);
    });
    
    ws.on('message', function message(data) {
        console.log('📨 Received message:', data.toString());
    });
    
    ws.on('error', function error(err) {
        console.error('❌ WebSocket error:', err.message);
        console.error('Full error:', err);
    });
    
    ws.on('close', function close(code, reason) {
        console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason}`);
    });
}

// Run the test
testWebSocketConnection().catch(console.error);
