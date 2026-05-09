import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from Underwate_image_enhancement import FeatureExtractor, TemporalLSTM

# Configuration
DATASET_PATH = r"d:\Major\Project\dataset"
MODEL_SAVE_PATH = r"d:\Major\Project\temporal_model.pth"
SEQUENCE_LENGTH = 5
BATCH_SIZE = 8
EPOCHS = 10  # Kept low for quick demonstration
LEARNING_RATE = 0.001

# Behavior Mapping based on folder names (Heuristic)
# Default is 'Swimming'
KEYWORD_TO_BEHAVIOR = {
    'Diver': 8,   # Diving
    'Diving': 8,  # Diving
    'Feeding': 1, # Feeding
    'Bites': 1,   # Feeding
    'Schooling': 6,
    'Following': 6, # Schooling
    'Resting': 2,
    'Surfacing': 9,
    'Interacting': 4,
    'Fisherman': 4
}
# Default behavior ID = 0 (Swimming)

def get_label_from_folder(folder_name):
    for key, label_id in KEYWORD_TO_BEHAVIOR.items():
        if key.lower() in folder_name.lower():
            return label_id
    return 0 # Default: Swimming

class MarineDataset(Dataset):
    def __init__(self, data, labels):
        self.data = torch.FloatTensor(data)
        self.labels = torch.LongTensor(labels)
        
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        return self.data[idx], self.labels[idx]

def load_data(dataset_path):
    print("Loading data from:", dataset_path)
    X_data = [] # List of sequences (5, 512)
    y_data = [] # List of labels
    
    feature_extractor = FeatureExtractor()
    
    
    subdirs = [d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))]
    # Limit to first 5 folders for speed during demo
    subdirs = subdirs[:5] 
    print(f"Found {len(subdirs)} sequences (limited for demo).")
    
    for folder in subdirs:
        folder_path = os.path.join(dataset_path, folder)
        gt_path = os.path.join(folder_path, "groundtruth_rect.txt")
        img_path = os.path.join(folder_path, "img")
        
        if not os.path.exists(gt_path) or not os.path.exists(img_path):
            print(f"Skipping {folder}: Missing gt or img folder")
            continue
            
        label = get_label_from_folder(folder)
        print(f"Processing {folder} -> Label {label}")
        
        # Read Ground Truth
        try:
            with open(gt_path, 'r') as f:
                lines = f.readlines()
                # Parse x,y,w,h (tab or comma or space separated)
                gt_rects = []
                for line in lines:
                    parts = line.strip().replace('\t', ' ').replace(',', ' ').split()
                    if len(parts) >= 4:
                        rect = list(map(int, map(float, parts[:4]))) # x,y,w,h
                        gt_rects.append(rect)
        except Exception as e:
            print(f"Error reading GT for {folder}: {e}")
            continue

        # Read Images
        try:
             image_files = sorted([f for f in os.listdir(img_path) if f.endswith('.jpg')], key=lambda x: int(''.join(filter(str.isdigit, x.split('.')[0]))))
        except ValueError:
             # Fallback to string sort if no digits
             image_files = sorted([f for f in os.listdir(img_path) if f.endswith('.jpg')])

        
        if len(image_files) != len(gt_rects):
            print(f"Warning: Count mismatch in {folder}. Imgs: {len(image_files)}, GT: {len(gt_rects)}")
            # Truncate to min
            min_len = min(len(image_files), len(gt_rects))
            image_files = image_files[:min_len]
            gt_rects = gt_rects[:min_len]
            
        # Extract Features per frame (Skip every 5 frames for speed)
        folder_features = []
        for i, img_file in enumerate(image_files):
            if i % 5 != 0: continue # Skip frames
            
            frame = cv2.imread(os.path.join(img_path, img_file))
            if frame is None: continue
            
            bbox = gt_rects[i] # [x, y, w, h]
            if bbox[2] <= 0 or bbox[3] <= 0: continue
            
            # Convert to [x1, y1, x2, y2] for FeatureExtractor (Wait, usage check)
            # Underwate_image_enhancement.py calls extract(frame, bbox) where det['bbox'] is usually [x1, y1, x2, y2]
            # But process_video rects are [x1, y1, x2, y2]
            # GroundTruth is [x, y, w, h]. Need to convert.
            x, y, w, h = bbox
            bbox_formatted = [x, y, x+w, y+h]
            
            feat = feature_extractor.extract(frame, bbox_formatted)
            # feat is numpy array (512,)
            folder_features.append(feat)
            
            if i % 50 == 0:
                print(f"  Extracted {i}/{len(image_files)}", end='\r')
        
        print(f"  Extracted {len(folder_features)} features.")
        
        # Create Sequences
        if len(folder_features) >= SEQUENCE_LENGTH:
            for i in range(len(folder_features) - SEQUENCE_LENGTH):
                seq = folder_features[i : i+SEQUENCE_LENGTH]
                X_data.append(seq)
                y_data.append(label)
                
    return np.array(X_data), np.array(y_data)

def train_model():
    X, y = load_data(DATASET_PATH)
    print(f"Training Data Shape: X={X.shape}, y={y.shape}")
    
    if len(X) == 0:
        print("No data found!")
        return

    dataset = MarineDataset(X, y)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)
    
    model = TemporalLSTM(input_size=512, hidden_size=128, num_classes=10) # 10 classes as defined in labels
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    dt = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(dt)
    
    print("Starting Training...")
    model.train()
    
    for epoch in range(EPOCHS):
        total_loss = 0
        for batch_X, batch_y in dataloader:
            batch_X, batch_y = batch_X.to(dt), batch_y.to(dt)
            
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss/len(dataloader):.4f}")
        
    print("Saving model...")
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train_model()
