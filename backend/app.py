
from flask import Flask, request, jsonify
import torch
from Underwate_image_enhancement import TemporalLSTM

app = Flask(__name__)

model = TemporalLSTM(input_size=512, hidden_size=128, num_classes=10)
model.load_state_dict(torch.load("temporal_model.pth", map_location="cpu"))
model.eval()

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        features = torch.tensor(data["features"]).float().unsqueeze(0)
        with torch.no_grad():
            output = model(features)
            pred = torch.argmax(output, dim=1).item()
        return jsonify({"prediction": pred})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
