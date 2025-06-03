import os
import json
import numpy as np
from cnn_model import MedicalChatbotModel
from django.conf import settings

def train_model():
    """Train the medical chatbot model with sample data"""
    # Sample training data
    questions = [
        "What are the symptoms of a cold?",
        "How do I know if I have the flu?",
        "What should I do for a headache?",
        "How can I treat a fever?",
        "What are the signs of a heart attack?",
        "How do I perform CPR?",
        "What are the symptoms of diabetes?",
        "How can I prevent getting sick?",
        "What should I do for a sprained ankle?",
        "How do I treat a burn?",
        "What are the symptoms of COVID-19?",
        "How do I check my blood pressure?",
        "What are the signs of a stroke?",
        "How much water should I drink daily?",
        "What are the benefits of exercise?",
        "How can I improve my sleep?",
        "What are the symptoms of allergies?",
        "How do I treat a sunburn?",
        "What should I eat for a healthy diet?",
        "How do I manage stress?"
    ]
    
    # Labels (category IDs)
    labels = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 5, 2, 5, 5, 5, 3, 4, 5, 5]
    
    # Corresponding answers
    answers = [
        "Common cold symptoms include runny nose, sore throat, coughing, and mild fever. Rest and fluids are recommended.",
        "Flu symptoms include high fever, body aches, fatigue, and respiratory symptoms. They typically come on suddenly.",
        "For a headache, try resting in a dark room, staying hydrated, and taking over-the-counter pain relievers if needed.",
        "For a fever, stay hydrated, rest, and take fever-reducing medication if necessary. Consult a doctor if the fever is high or persistent.",
        "Heart attack signs include chest pain/pressure, pain radiating to arm/jaw, shortness of breath, and cold sweats. Seek emergency help immediately.",
        "For CPR, push hard and fast on the center of the chest at a rate of 100-120 compressions per minute. Call emergency services first.",
        "Diabetes symptoms include increased thirst/urination, unexplained weight loss, fatigue, and blurred vision.",
        "Prevent illness by washing hands frequently, avoiding close contact with sick people, and maintaining a healthy lifestyle.",
        "For a sprained ankle, remember RICE: Rest, Ice, Compression, and Elevation. Avoid putting weight on it initially.",
        "For burns, cool the area with running water, don't use ice, and don't pop blisters. Seek medical help for severe burns.",
        "COVID-19 symptoms include fever, cough, shortness of breath, fatigue, and loss of taste or smell.",
        "To check blood pressure, use a home monitor or visit a pharmacy. Sit quietly for 5 minutes before measuring.",
        "Stroke signs can be remembered with FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services.",
        "Most adults should drink about 8 cups (64 ounces) of water daily, but needs vary based on activity level and climate.",
        "Regular exercise improves cardiovascular health, strengthens muscles, enhances mood, and helps maintain a healthy weight.",
        "Improve sleep by maintaining a regular schedule, creating a restful environment, limiting screen time before bed, and avoiding caffeine late in the day.",
        "Allergy symptoms include sneezing, itchy eyes/nose/throat, runny nose, and congestion. Antihistamines can help manage symptoms.",
        "For sunburn, cool the skin with cold compresses, apply aloe vera, stay hydrated, and avoid further sun exposure.",
        "A healthy diet includes plenty of fruits, vegetables, whole grains, lean proteins, and limited processed foods and added sugars.",
        "Manage stress through regular exercise, adequate sleep, relaxation techniques like deep breathing or meditation, and maintaining social connections."
    ]
    
    # Create and train the model
    model = MedicalChatbotModel()
    model.train(questions, labels, answers, epochs=50, batch_size=4)
    
    # Save the model and associated data
    model_dir = os.path.join(settings.BASE_DIR, 'ai_model', 'model_weights')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'model.h5')
    tokenizer_path = os.path.join(model_dir, 'tokenizer.json')
    responses_path = os.path.join(model_dir, 'responses.json')
    
    model.save_model(model_path, tokenizer_path, responses_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    # This allows the script to be run directly
    import django
    import sys
    import os
    
    # Add the project directory to the Python path
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_healthcare_bot.settings')
    django.setup()
    
    # Train the model
    train_model()
