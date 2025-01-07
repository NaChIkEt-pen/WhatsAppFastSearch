# WhatsApp Fast Search - Chrome Extension

A powerful Chrome extension that enables semantic search capabilities for WhatsApp Web conversations using AI embeddings.

## Features

- **Semantic Search**: Search through WhatsApp conversations using natural language queries
- **Secure Authentication**: OTP-based authentication via WhatsApp
- **Real-time Processing**: Continuously processes new messages as they appear
- **Data Privacy**: User-specific data storage with secure access controls
- **Easy Interface**: Simple and intuitive UI integrated into WhatsApp Web

## How It Works

### Frontend (Chrome Extension)

1. **Authentication Flow**
   - Users enter their mobile number
   - Receive OTP via WhatsApp
   - JWT-based session management
   - Auto-expiry of sessions after 1 hour

2. **Message Processing**
   - Monitors WhatsApp Web DOM for new messages
   - Captures text content using MutationObserver
   - Buffers messages to optimize server requests
   - Maintains unique message tracking to prevent duplicates

3. **Search Interface**
   - Real-time search capabilities
   - Displays semantically relevant results
   - Options to start/stop message tracking
   - Clear data functionality

### Backend (Python Server)

1. **API Server**
   - Flask-based REST API
   - CORS enabled for extension communication
   - JWT-based authentication validation
   - Error handling and status reporting

## Installation

### Backend

1. Clone the repository
2. Navigate to the `Embeddings` directory
3. Create a virtual environment and activate it:
   ```bash
   python3 -m venv SemanticSearchEnv
   source SemanticSearchEnv/bin/activate
   pip install -r requirements.txt
   python server.py
   ```
