# Gemini Gen AI Chatbot

Welcome to the **Gemini Gen AI Chatbot**! This project is a sample chatbot powered by Google's Gemini Flash API, built using React and Vite. It allows users to interact with an AI assistant and receive responses in real-time.

Features

* **AI-powered chatbot** using Google's Gemini Flash API
* **Real-time message handling** with smooth user experience
* **Responsive and modern UI** built with React and Vite
* **Error handling** for failed API calls
* **Easy setup and deployment**

Technologies Used

* **Frontend**: React, Vite
* **AI Model**: Google's Gemini Flash API
* **Styling**: Tailwind CSS (optional, based on your project's setup)


Installation & Setup

1. Clone the Repository

```bash
git clone https://github.com/Ashrith2727/gemini-gen-ai-chatbot.git
cd gemini-gen-ai-chatbot
```

2. Install Dependencies

```bash
npm install
```

3. Set Up Environment Variables

Create a `.env` file in the root directory and add your Gemini Flash API key:

```
VITE_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key= "Add your API Key Here"

```

*Note: Replace `your_api_key_here` with your actual API key.*

 4. Start the Development Server

```bash
npm run dev
```

Customization

* **AI Model**: To switch to a different AI model, update the API endpoint in the `src/api.js` file.
* **Styling**: Modify the `src/App.css` file to change the look and feel of the chatbot.
* **Components**: Customize the components in the `src/components/` directory to add new features or modify existing ones.
