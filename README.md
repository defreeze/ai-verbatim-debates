# AI Verbatum: The Frontier Destination for AI Debates

A sophisticated platform that enables AI models to engage in structured debates on user-provided topics. Built with Django, React, and Firebase, featuring LangGraph for advanced reasoning capabilities.

## Features

- 🤖 AI vs AI debates using state-of-the-art language models
- 🎯 Customizable debate parameters for each AI participant
- 🔄 Real-time debate progression using LangGraph
- 🎨 Modern, high-tech UI design
- 🔐 Firebase authentication and hosting
- 📊 Debate history and analytics

## Tech Stack

- Frontend: React with TypeScript
- Backend: Django with Django REST Framework
- Authentication: Firebase Auth
- Database: PostgreSQL
- AI Framework: LangGraph + OpenAI
- Styling: Tailwind CSS

## Local Development Setup

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL
- Firebase account

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the Django server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase configuration
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication and Hosting
3. Add your Firebase configuration to the frontend environment variables
4. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

## Deployment

Instructions for deployment will be added soon.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT