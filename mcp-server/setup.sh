#!/bin/bash

# GoLong Supabase MCP Server Setup Script

echo "🚀 Setting up GoLong Supabase MCP Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mcp-server directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Create a simple test script
echo "🧪 Creating test script..."
cat > test-mcp.js << 'EOF'
#!/usr/bin/env node

// Simple test script for the MCP server
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing MCP Server...');
console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Please set your Supabase credentials in .env file');
    process.exit(1);
}

// Test the server by running it briefly
const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (data) => {
    output += data.toString();
});

server.stderr.on('data', (data) => {
    console.log('Server output:', data.toString());
});

// Kill the server after 2 seconds
setTimeout(() => {
    server.kill();
    console.log('✅ MCP Server test completed');
    console.log('📋 Next steps:');
    console.log('1. Configure your MCP client (Claude Desktop, Cursor, etc.)');
    console.log('2. Add the server configuration to your MCP client config');
    console.log('3. Test with natural language queries');
}, 2000);
EOF

chmod +x test-mcp.js

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Supabase credentials"
echo "2. Run 'npm run test' to test the server"
echo "3. Configure your MCP client with the server"
echo "4. Start using natural language database queries!"
echo ""
echo "📖 For detailed instructions, see README.md"

