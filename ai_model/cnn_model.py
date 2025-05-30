import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Embedding, GlobalAveragePooling1D, Conv1D, MaxPooling1D, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import json
import os

class MedicalChatbotModel:
    def __init__(self, max_words=10000, max_sequence_length=100):
        self.max_words = max_words
        self.max_sequence_length = max_sequence_length
        self.tokenizer = Tokenizer(num_words=max_words)
        self.model = None
        self.responses = {}
    
    def preprocess_data(self, questions, labels):
        """Preprocess the training data"""
        # Fit tokenizer on questions
        self.tokenizer.fit_on_texts(questions)
        
        # Convert questions to sequences
        sequences = self.tokenizer.texts_to_sequences(questions)
        
        # Pad sequences to ensure uniform length
        padded_sequences = pad_sequences(sequences, maxlen=self.max_sequence_length)
        
        # Convert labels to numpy array
        labels = np.array(labels)
        
        return padded_sequences, labels
    
    def build_model(self, num_classes):
        """Build the CNN model"""
        model = Sequential([
            Embedding(self.max_words, 128, input_length=self.max_sequence_length),
            Conv1D(128, 5, activation='relu'),
            MaxPooling1D(5),
            Conv1D(128, 5, activation='relu'),
            MaxPooling1D(5),
            GlobalAveragePooling1D(),
            Dense(128, activation='relu'),
            Dropout(0.5),
            Dense(num_classes, activation='softmax')
        ])
        
        model.compile(
            loss='sparse_categorical_crossentropy',
            optimizer='adam',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def train(self, questions, labels, answers, epochs=10, batch_size=32, validation_split=0.2):
        """Train the model"""
        # Preprocess data
        X, y = self.preprocess_data(questions, labels)
        
        # Build model if not already built
        if self.model is None:
            num_classes = len(set(labels))
            self.build_model(num_classes)
        
        # Train the model
        history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=1
        )
        
        # Store responses
        unique_labels = set(labels)
        for label in unique_labels:
            # Find the first answer for each label
            for i, l in enumerate(labels):
                if l == label:
                    self.responses[str(label)] = answers[i]
                    break
        
        return history
    
    def save_model(self, model_path, tokenizer_path, responses_path):
        """Save the model, tokenizer, and responses"""
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save the model
        self.model.save(model_path)
        
        # Save the tokenizer
        tokenizer_json = {
            'word_index': self.tokenizer.word_index,
            'index_word': {str(k): v for k, v in self.tokenizer.index_word.items()},
            'word_counts': {k: int(v) for k, v in self.tokenizer.word_counts.items()},
            'document_count': self.tokenizer.document_count
        }
        with open(tokenizer_path, 'w') as f:
            json.dump(tokenizer_json, f)
        
        # Save the responses
        with open(responses_path, 'w') as f:
            json.dump(self.responses, f)
    
    def load_model(self, model_path, tokenizer_path, responses_path):
        """Load the model, tokenizer, and responses"""
        # Load the model
        self.model = tf.keras.models.load_model(model_path)
        
        # Load the tokenizer
        with open(tokenizer_path, 'r') as f:
            tokenizer_json = json.load(f)
            self.tokenizer = Tokenizer(num_words=self.max_words)
            self.tokenizer.word_index = tokenizer_json['word_index']
            self.tokenizer.index_word = {int(k): v for k, v in tokenizer_json['index_word'].items()}
        
        # Load the responses
        with open(responses_path, 'r') as f:
            self.responses = json.load(f)
    
    def predict(self, text):
        """Predict the class of a text input"""
        # Preprocess the input
        sequence = self.tokenizer.texts_to_sequences([text])
        padded_sequence = pad_sequences(sequence, maxlen=self.max_sequence_length)
        
        # Make prediction
        prediction = self.model.predict(padded_sequence)[0]
        predicted_class = np.argmax(prediction)
        confidence = prediction[predicted_class]
        
        return predicted_class, confidence, self.responses.get(str(predicted_class))
