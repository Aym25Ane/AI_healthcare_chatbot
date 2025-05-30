import pandas as pd
import numpy as np
import re
import string
import os
from django.conf import settings

def clean_text(text):
    """Clean and preprocess text"""
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def load_data_from_csv(file_path):
    """Load and preprocess data from a CSV file"""
    try:
        # Load the CSV file
        df = pd.read_csv(file_path)
        
        # Check if required columns exist
        required_columns = ['question', 'answer', 'category']
        if not all(col in df.columns for col in required_columns):
            print(f"CSV file must contain columns: {required_columns}")
            return None, None, None
        
        # Clean the questions
        df['question_cleaned'] = df['question'].apply(clean_text)
        
        # Extract the data
        questions = df['question_cleaned'].tolist()
        answers = df['answer'].tolist()
        
        # Convert categories to numeric labels
        categories = df['category'].unique()
        category_to_id = {category: i for i, category in enumerate(categories)}
        labels = df['category'].map(category_to_id).tolist()
        
        return questions, labels, answers
    
    except Exception as e:
        print(f"Error loading data from CSV: {e}")
        return None, None, None

def save_category_mapping(category_to_id, file_path):
    """Save the category to ID mapping"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save the mapping
        with open(file_path, 'w') as f:
            for category, id in category_to_id.items():
                f.write(f"{category},{id}\n")
        
        print(f"Category mapping saved to {file_path}")
    
    except Exception as e:
        print(f"Error saving category mapping: {e}")

def load_category_mapping(file_path):
    """Load the category to ID mapping"""
    try:
        category_to_id = {}
        
        with open(file_path, 'r') as f:
            for line in f:
                category, id = line.strip().split(',')
                category_to_id[category] = int(id)
        
        return category_to_id
    
    except Exception as e:
        print(f"Error loading category mapping: {e}")
        return {}

def process_training_data():
    """Process training data from CSV files"""
    data_dir = os.path.join(settings.BASE_DIR, 'ai_model', 'training_data')
    output_dir = os.path.join(settings.BASE_DIR, 'ai_model', 'processed_data')
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Process each CSV file in the training_data directory
    for filename in os.listdir(data_dir):
        if filename.endswith('.csv'):
            file_path = os.path.join(data_dir, filename)
            print(f"Processing {file_path}...")
            
            # Load and process the data
            questions, labels, answers = load_data_from_csv(file_path)
            
            if questions is not None:
                # Save the processed data
                output_file = os.path.join(output_dir, f"processed_{filename}")
                df = pd.DataFrame({
                    'question': questions,
                    'label': labels,
                    'answer': answers
                })
                df.to_csv(output_file, index=False)
                print(f"Processed data saved to {output_file}")

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
    
    # Process the training data
    process_training_data()
