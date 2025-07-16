import numpy as np

class KeyPredictionModel:
    def __init__(self):
        self.key_map = {
            0: 'A', 1: 'B', 2: 'C', 3: 'D',
            4: 'E', 5: 'F', 6: 'G', 7: 'H'
        }

    def predict(self, hand_landmarks):
        if not isinstance(hand_landmarks, np.ndarray):
            raise ValueError("Input must be a numpy array")
        index = np.argmax(hand_landmarks[:, 0]) % len(self.key_map)
        return self.key_map.get(index, '?')

if __name__ == "__main__":
    fake_hand_data = np.random.rand(21, 2)
    model = KeyPredictionModel()
    predicted_key = model.predict(fake_hand_data)
    print("Predicted key:", predicted_key)
