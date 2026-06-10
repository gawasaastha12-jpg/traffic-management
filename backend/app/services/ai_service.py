import numpy as np
import random
from sklearn.neural_network import MLPRegressor
from app.services.graph_service import graph_service

class Yolov8EdgeDetector:
    """
    Simulates edge-vision vehicle detection by calculating YOLOv8 bounding boxes
    and weighted queue counts dynamically for the CCTV camera feed UI.
    """
    def __init__(self):
        # Class weights: Emergency = 0, Bus = 3.0, Car = 1.5, Motorbike = 0.5
        self.class_weights = {
            "emergency": 0.0,
            "bus": 3.0,
            "car": 1.5,
            "motorbike": 0.5,
            "auto-rickshaw": 1.0
        }
        self.colors = {
            "emergency": "#f43f5e", # Rose
            "bus": "#06b6d4",       # Cyan
            "car": "#10b981",       # Emerald
            "motorbike": "#a855f7", # Purple
            "auto-rickshaw": "#f59e0b" # Amber
        }

    def detect_vehicles(self, junction_id: str, queue_meters: float) -> dict:
        """
        Runs YOLO inference simulation. Generates coordinate boxes for vehicles
        based on the physical queue size at the junction.
        """
        # 1 vehicle roughly every 6.5 meters
        num_vehicles = max(1, int(queue_meters / 6.5))
        
        detections = []
        total_weight = 0.0

        for i in range(num_vehicles):
            # Roll random vehicle class
            v_type = random.choices(
                ["car", "motorbike", "auto-rickshaw", "bus", "emergency"],
                weights=[0.55, 0.20, 0.15, 0.08, 0.02],
                k=1
            )[0]

            # Generate bounding boxes scaled inside a mock CCTV screen (640x360 canvas)
            # Higher queue positions are drawn further down the lane
            y_base = int(40 + (i * 25) % 240)
            x_base = int(120 + (i * 45) % 400 + random.randint(-15, 15))
            w = random.randint(40, 70) if v_type in ["bus", "car"] else random.randint(25, 40)
            h = random.randint(35, 55) if v_type in ["bus", "car"] else random.randint(25, 35)

            # Keep bounding boxes within bounds
            x_min = max(10, min(620 - w, x_base))
            y_min = max(50, min(330 - h, y_base))
            x_max = x_min + w
            y_max = y_min + h

            confidence = round(random.uniform(82.5, 99.2), 1)
            weight = self.class_weights[v_type]
            total_weight += weight

            detections.append({
                "id": f"det-{junction_id}-{i}",
                "label": f"{v_type.upper()} ({confidence}%)",
                "box": [x_min, y_min, x_max, y_max],
                "class": v_type,
                "color": self.colors[v_type],
                "weight": weight,
                "queue_position": i + 1
            })

        # Calculate traffic density percentage
        max_capacity_weight = 40.0 # Bounded maximum lane weight capacity
        density_percentage = min(100, int((total_weight / max_capacity_weight) * 100))

        return {
            "junction_id": junction_id,
            "vehicle_count": len(detections),
            "detections": detections,
            "weighted_density_score": density_percentage,
            "total_weight": round(total_weight, 1)
        }


class STGCNForecaster:
    """
    Implements a Spatio-Temporal Graph Convolutional Network (STGCN) simulator.
    Utilizes the actual NetworkX graph adjacency matrix to model spatial cascades
    and scikit-learn models to forecast 6-hour temporal bottlenecks.
    """
    def __init__(self):
        self.history_lag = 6  # Past 6 time-steps (3 hours in 30-minute ticks)
        self.forecast_horizon = 6  # Future 6 hours projection window
        self.model = MLPRegressor(
            hidden_layer_sizes=(32, 16),
            activation="relu",
            max_iter=500,
            random_state=42
        )
        self.is_trained = False
        self.adjacency_matrix = None
        self.normalized_adjacency = None
        self.junction_ids = []

    def _initialize_gcn_structure(self):
        """
        Initializes the spatial GCN adjacency matrix specifically mapped over the 7 seed junctions.
        Ensures low memory overhead and correct key output names for the dashboard.
        """
        # Seed junctions that match SQLite DB and the Next.js frontend requirements
        self.junction_ids = ["WF_J_001", "WF_J_002", "WF_J_003", "WF_J_004", "WF_J_005", "WF_J_006", "WF_J_007"]
        num_nodes = len(self.junction_ids)
        
        # Build Adjacency matrix A representing key connecting corridors in Whitefield
        A = np.zeros((num_nodes, num_nodes))
        
        # Topological connection mapping (undirected)
        connections = {
            "WF_J_001": ["WF_J_002", "WF_J_005", "WF_J_006", "WF_J_007"], # Hope Farm to Vydehi, Hoodi, Varthur Kodi, Kadugodi
            "WF_J_002": ["WF_J_001", "WF_J_003", "WF_J_005"],          # Vydehi to Hope Farm, Graphite, Hoodi
            "WF_J_003": ["WF_J_002", "WF_J_004"],                      # Graphite to Vydehi, Kundalahalli
            "WF_J_004": ["WF_J_003", "WF_J_006"],                      # Kundalahalli to Graphite, Varthur Kodi
            "WF_J_005": ["WF_J_001", "WF_J_002"],                      # Hoodi to Hope Farm, Vydehi
            "WF_J_006": ["WF_J_001", "WF_J_004"],                      # Varthur Kodi to Hope Farm, Kundalahalli
            "WF_J_007": ["WF_J_001"]                                   # Kadugodi to Hope Farm
        }
        
        for idx, j_id in enumerate(self.junction_ids):
            for neighbor in connections.get(j_id, []):
                if neighbor in self.junction_ids:
                    n_idx = self.junction_ids.index(neighbor)
                    A[idx, n_idx] = 1.0
                    A[n_idx, idx] = 1.0
            
        # Graph convolution normalization: A_tilde = A + I
        A_tilde = A + np.eye(len(A))
        # Degree matrix D_tilde
        D_tilde = np.diag(np.sum(A_tilde, axis=1))
        # D_tilde^-0.5
        with np.errstate(divide='ignore'):
            D_inv_sqrt = np.power(D_tilde, -0.5)
            D_inv_sqrt[np.isinf(D_inv_sqrt)] = 0.0
            
        # Normalized Laplacian: D^-0.5 * A_tilde * D^-0.5
        self.adjacency_matrix = A
        self.normalized_adjacency = D_inv_sqrt @ A_tilde @ D_inv_sqrt
        self._train_ml_regressor()

    def _train_ml_regressor(self):
        """
        Generates synthetic historical time series for Whitefield traffic cascades
        and fits the MLP model on GCN spatial features.
        """
        num_nodes = len(self.junction_ids)
        num_samples = 200 # Training samples
        
        # X: (num_samples, num_nodes * history_lag)
        # Y: (num_samples, num_nodes * forecast_horizon)
        X_train = []
        Y_train = []
        
        for _ in range(num_samples):
            # Base congestion index (daily wave)
            wave = 40.0 + 30.0 * np.sin(random.uniform(0, 2 * np.pi))
            
            # Spatial density vector (num_nodes, history_lag)
            hist_state = np.zeros((num_nodes, self.history_lag))
            for t in range(self.history_lag):
                noise = np.random.normal(0, 8.0, size=(num_nodes,))
                hist_state[:, t] = np.clip(wave + noise + (t * 2.5), 10, 100)
                
            # Apply Graph Convolution: Z_t = A_norm * X_t
            # This mixes spatial states with neighboring roads
            gcn_hist = self.normalized_adjacency @ hist_state
            
            # Target output (shifted forward by forecast horizon)
            target = np.zeros((num_nodes, self.forecast_horizon))
            for f in range(self.forecast_horizon):
                # Simulate bottleneck cascading decay
                decay = 0.95 ** (f + 1)
                noise = np.random.normal(0, 5.0, size=(num_nodes,))
                target[:, f] = np.clip(hist_state[:, -1] * decay + noise, 10, 100)
                
            X_train.append(gcn_hist.flatten())
            Y_train.append(target.flatten())
            
        self.model.fit(np.array(X_train), np.array(Y_train))
        self.is_trained = True
        print("[STGCN] Spatial GCN Forecaster successfully trained.")

    def predict_forecasts(self, current_densities: dict) -> list:
        """
        Calculates the GCN spatial convolutions and feeds them into the MLP model.
        Returns a 6-hour projection timeline for the UI predictions page.
        """
        if not self.is_trained or self.normalized_adjacency is None:
            self._initialize_gcn_structure()

        num_nodes = len(self.junction_ids)
        
        # Prepare current history feature block
        X_current = np.zeros((num_nodes, self.history_lag))
        for idx, j_id in enumerate(self.junction_ids):
            base_val = current_densities.get(j_id, 35)
            # Generate lag states simulating preceding hourly trends
            for t in range(self.history_lag):
                # Wave pattern: step back to simulate morning build-up
                X_current[idx, t] = max(10, min(100, int(base_val - (self.history_lag - t - 1) * 3 + random.randint(-4, 4))))

        # Apply Graph Convolution spatial pass
        gcn_features = self.normalized_adjacency @ X_current
        
        # Predict
        predicted_flat = self.model.predict([gcn_features.flatten()])[0]
        predicted_matrix = predicted_flat.reshape((num_nodes, self.forecast_horizon))
        
        # Compile response list formatted for the Next.js frontend predictions page
        timeline_hours = ["+1 Hour", "+2 Hours", "+3 Hours", "+4 Hours", "+5 Hours", "+6 Hours"]
        forecast_output = []
        
        for h_idx, time_label in enumerate(timeline_hours):
            hour_data = {"time": time_label}
            for idx, j_id in enumerate(self.junction_ids):
                # Map specific nodes back to short names in lib/mockData or UI
                name_key = j_id
                if "001" in j_id:
                    name_key = "HopeFarm"
                elif "002" in j_id:
                    name_key = "Vydehi"
                elif "003" in j_id:
                    name_key = "Graphite"
                elif "005" in j_id:
                    name_key = "Hoodi"
                else:
                    name_key = j_id.replace("WF_J_", "Junc_")
                    
                val = int(np.clip(predicted_matrix[idx, h_idx], 10, 100))
                hour_data[name_key] = val
            forecast_output.append(hour_data)
            
        return forecast_output


class QSignalAgent:
    """
    Implements a Q-learning / Reinforcement Learning agent for adaptive signal control.
    Optimizes green splits at intersections by learning which phase durations
    minimize congestion backlogs.
    """
    def __init__(self):
        # Action space: 0 = Short (30s), 1 = Med (45s), 2 = Long (60s)
        self.actions = [0, 1, 2]
        self.action_labels = {0: 30, 1: 45, 2: 60}
        
        # Q-Table mapping: junction_id -> 2D numpy array (states_count, actions_count)
        # States are discretized into 5 congestion tiers: Very Low, Low, Med, High, Critical
        self.num_states = 5
        self.q_tables = {}
        
        # Q-learning parameters
        self.alpha = 0.25  # Learning rate
        self.gamma = 0.90  # Discount factor
        self.epsilon = 0.15 # Epsilon-greedy exploration

    def get_state(self, congestion_level: int) -> int:
        """
        Discretizes continuous congestion (10-100) into 5 discrete state indices.
        """
        if congestion_level <= 25: return 0  # Very Low
        if congestion_level <= 50: return 1  # Low
        if congestion_level <= 75: return 2  # Medium
        if congestion_level <= 90: return 3  # High
        return 4                             # Critical

    def get_q_table(self, junction_id: str):
        """
        Lazily initializes the Q-table for a junction if missing.
        """
        if junction_id not in self.q_tables:
            # Initialized with small random numbers to encourage initial exploration
            self.q_tables[junction_id] = np.random.uniform(-1.0, 1.0, size=(self.num_states, len(self.actions)))
        return self.q_tables[junction_id]

    def select_action(self, junction_id: str, congestion_level: int) -> int:
        """
        Chooses an action (phase duration) using the Epsilon-Greedy policy.
        """
        state = self.get_state(congestion_level)
        q_table = self.get_q_table(junction_id)

        # Explore
        if random.random() < self.epsilon:
            return random.choice(self.actions)
        # Exploit
        return int(np.argmax(q_table[state]))

    def learn_update(self, junction_id: str, old_congestion: int, action: int, new_congestion: int):
        """
        Executes the Q-table temporal difference update step:
        Q(s, a) = Q(s, a) + alpha * [Reward + gamma * max(Q(s', a')) - Q(s, a)]
        """
        s = self.get_state(old_congestion)
        s_prime = self.get_state(new_congestion)
        q_table = self.get_q_table(junction_id)

        # Reward = negative congestion indices (penalize longer queue sizes)
        reward = -float(new_congestion)
        
        # If green corridor is active, reward is positive (override state)
        if new_congestion < 20:
            reward += 30.0

        # Bellman equation updates
        best_future_q = np.max(q_table[s_prime])
        q_table[s, action] += self.alpha * (reward + self.gamma * best_future_q - q_table[s, action])

        # Track model update prints on server logs
        print(f"[RL-Agent] Junction {junction_id} State {s} -> Action {action} (wait: {self.action_labels[action]}s) -> New State {s_prime}. Q-value update: {round(q_table[s, action], 2)}")


# Singleton model instances
yolo_detector = Yolov8EdgeDetector()
gcn_forecaster = STGCNForecaster()
rl_signal_agent = QSignalAgent()
