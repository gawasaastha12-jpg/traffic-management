import sys
import os

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from app.services.ai_service import yolo_detector, gcn_forecaster, rl_signal_agent
    print("SUCCESS: Modules imported correctly.")
except Exception as e:
    print(f"FAILED: Import error: {e}")
    sys.exit(1)

# Test 1: YOLO Edge Detector
print("\n--- Test 1: YOLO Edge Detector ---")
try:
    result = yolo_detector.detect_vehicles("WF_J_001", queue_meters=35.0)
    print(f"Junction: {result['junction_id']}")
    print(f"Vehicle count: {result['vehicle_count']}")
    print(f"Total weight: {result['total_weight']}")
    print(f"Density score: {result['weighted_density_score']}%")
    print(f"Sample detection: {result['detections'][0] if result['detections'] else 'None'}")
    print("SUCCESS: YOLO edge simulation works.")
except Exception as e:
    print(f"FAILED: YOLO Edge Detector test failed: {e}")

# Test 2: GCN Spatial Forecaster
print("\n--- Test 2: GCN Spatial Forecaster ---")
try:
    densities = {
        "WF_J_001": 75,
        "WF_J_002": 50,
        "WF_J_003": 88,
        "WF_J_004": 25,
        "WF_J_005": 35,
        "WF_J_006": 60,
        "WF_J_007": 20
    }
    # Initialize GCN structures
    gcn_forecaster._initialize_gcn_structure()
    predictions = gcn_forecaster.predict_forecasts(densities)
    print(f"Forecast entries count: {len(predictions)}")
    print(f"Sample prediction at {predictions[0]['time']}: {predictions[0]}")
    print("SUCCESS: GCN Spatial Forecaster works.")
except Exception as e:
    print(f"FAILED: GCN Forecaster test failed: {e}")

# Test 3: Q-learning RL Agent
print("\n--- Test 3: Reinforcement Learning Signal Agent ---")
try:
    j_id = "WF_J_001"
    # Choose action on 50% congestion (state = 1 or 2)
    action = rl_signal_agent.select_action(j_id, congestion_level=50)
    print(f"Initial action chosen for 50% congestion: action {action} ({rl_signal_agent.action_labels[action]}s Split)")
    
    # Simulate step and learn
    rl_signal_agent.learn_update(j_id, old_congestion=50, action=action, new_congestion=35)
    
    # Choose next action
    next_action = rl_signal_agent.select_action(j_id, congestion_level=35)
    print(f"Updated action chosen for 35% congestion: action {next_action} ({rl_signal_agent.action_labels[next_action]}s Split)")
    print("SUCCESS: RL Agent Q-learning cycle complete.")
except Exception as e:
    print(f"FAILED: RL Agent test failed: {e}")
