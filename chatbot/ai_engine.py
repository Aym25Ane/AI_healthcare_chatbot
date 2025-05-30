import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from django.conf import settings

# Path to model and data files
MODEL_PATH = os.path.join(settings.AI_MODEL_PATH, 'model.h5')
TOKENIZER_PATH = os.path.join(settings.AI_MODEL_PATH, 'tokenizer.json')
RESPONSES_PATH = os.path.join(settings.AI_MODEL_PATH, 'responses.json')
MAX_SEQUENCE_LENGTH = 100

# Initialize global variables
model = None
tokenizer = None
responses = None

def load_model_and_data():
    """Load the trained model and associated data"""
    global model, tokenizer, responses
    
    try:
        # Load the model if it exists
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully")
        else:
            print("Model file not found. Using fallback responses.")
        
        # Load the tokenizer if it exists
        if os.path.exists(TOKENIZER_PATH):
            with open(TOKENIZER_PATH, 'r') as f:
                tokenizer_json = json.load(f)
                tokenizer = Tokenizer()
                tokenizer.word_index = tokenizer_json['word_index']
                tokenizer.index_word = {int(k): v for k, v in tokenizer_json['index_word'].items()}
            print("Tokenizer loaded successfully")
        else:
            print("Tokenizer file not found. Using fallback tokenizer.")
            tokenizer = Tokenizer()
        
        # Load the responses if they exist
        if os.path.exists(RESPONSES_PATH):
            with open(RESPONSES_PATH, 'r') as f:
                responses = json.load(f)
            print("Responses loaded successfully")
        else:
            print("Responses file not found. Using fallback responses.")
            responses = {
                "0": "I'm sorry, I don't have enough information to answer that question.",
                "1": "That's a good question about health. Let me provide some general information.",
                "2": "I recommend consulting with a healthcare professional for personalized advice.",
                "3": "I'm here to provide general health information, but I can't diagnose conditions.",
                "4": "For emergency situations, please contact emergency services immediately."
            }
    except Exception as e:
        print(f"Error loading model or data: {e}")
        # Set up fallback responses
        responses = {
            "fallback": "I'm sorry, I encountered an issue processing your request. Please try again later."
        }

def preprocess_input(text):
    """Preprocess the input text for the model"""
    if tokenizer is None:
        return None
    
    # Convert text to sequence of tokens
    sequences = tokenizer.texts_to_sequences([text])
    # Pad the sequence to ensure uniform length
    padded_sequences = pad_sequences(sequences, maxlen=MAX_SEQUENCE_LENGTH)
    return padded_sequences

def get_ai_response(user_input):
    """Get AI response for user input"""
    global model, tokenizer, responses
    
    # Load model and data if not already loaded
    if model is None or tokenizer is None or responses is None:
        load_model_and_data()
    
    # If model is still None after loading attempt, use fallback
    if model is None:
        return get_fallback_response(user_input)
    
    # Preprocess the input
    processed_input = preprocess_input(user_input)
    
    if processed_input is None:
        return "I'm sorry, I couldn't process your question. Please try rephrasing it."
    
    try:
        # Get prediction from model
        prediction = model.predict(processed_input)[0]
        
        # Get the index of the highest probability
        predicted_class = np.argmax(prediction)
        
        # Get the confidence level
        confidence = prediction[predicted_class]
        
        # If confidence is too low, return a default response
        if confidence < 0.5:
            return "I'm not sure I understand your question. Could you please rephrase it?"
        
        # Return the corresponding response
        response_key = str(predicted_class)
        return responses.get(response_key, "I don't have an answer for that yet.")
    
    except Exception as e:
        print(f"Error generating response: {e}")
        return get_fallback_response(user_input)

# Simple fallback function for when the model is not available
def get_fallback_response(user_input):
    """Get a fallback response based on keywords in the input"""
    user_input = user_input.lower()
    
    if any(word in user_input for word in ['emergency', 'urgent', 'help', 'pain']):
        return "If you're experiencing a medical emergency, please call emergency services immediately."
    
    if any(word in user_input for word in ['headache', 'head', 'pain']):
        return "Headaches can be caused by various factors including stress, dehydration, or lack of sleep. For persistent headaches, please consult a healthcare professional."
    
    if any(word in user_input for word in ['cold', 'flu', 'fever', 'cough']):
        return "Common cold symptoms include coughing, sore throat, and congestion. Rest, stay hydrated, and consider over-the-counter medications for symptom relief. Consult a doctor if symptoms persist or worsen."
    
    if any(word in user_input for word in ['doctor', 'hospital', 'clinic', 'appointment']):
        return "I can help you find nearby healthcare facilities. Would you like me to search for hospitals, clinics, or doctor's offices in your area?"
    
    # Default fallback response
    return "I'm here to provide general health information. How can I assist you today?"
