import socket
from app.config import settings

class SumoAdapter:
    def __init__(self):
        self.server_ip = settings.SUMO_SERVER_IP
        self.server_port = settings.SUMO_SERVER_PORT
        self.traci = None
        self.connected = False

    def try_initialize_traci(self) -> bool:
        """
        Attempts to import traci and connect to a running SUMO server instance.
        Returns True if successful, False otherwise.
        """
        try:
            # Try importing traci (available if SUMO is installed on host)
            import traci
            self.traci = traci
            print("[SUMO] TraCI library found. Checking TCP socket connection...")
            
            # Fast TCP port availability check to prevent long timeout delays
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1.0)
            result = s.connect_ex((self.server_ip, self.server_port))
            s.close()
            
            if result == 0:
                # Port is open, try connecting traci
                traci.connect(host=self.server_ip, port=self.server_port)
                self.connected = True
                print(f"[SUMO] Successfully connected to SUMO server at {self.server_ip}:{self.server_port}!")
                return True
            else:
                print(f"[SUMO] TCP port {self.server_port} closed. SUMO Server is offline.")
                return False
        except ImportError:
            print("[SUMO] TraCI Python library is not installed. Install via pip if running SUMO locally.")
            return False
        except Exception as e:
            print(f"[SUMO] Connection initialization failed: {e}")
            return False

    def get_micro_simulation_metrics(self, junction_id: str):
        """
        Reads queue lengths from active SUMO nodes.
        Falls back to empty values if disconnected.
        """
        if not self.connected or not self.traci:
            return None

        try:
            # In SUMO, junctions are represented as junctions or tlLogic (Traffic Light)
            # Retrieve queue parameters
            # traci.junction.getShape(junction_id)
            # traci.lane.getLastStepVehicleNumber(lane_id)
            # We fetch total stopped vehicles near junction lanes
            controlled_lanes = self.traci.trafficlight.getControlledLanes(junction_id)
            total_waiting = 0
            for lane in controlled_lanes:
                total_waiting += self.traci.lane.getLastStepHaltingNumber(lane)

            # Delay = sum of waiting time of all halted vehicles
            total_delay = 0.0
            for lane in controlled_lanes:
                total_delay += self.traci.lane.getWaitingTime(lane)

            return {
                "queue_count": total_waiting,
                "queue_meters": total_waiting * 6.5,
                "average_delay_seconds": round(total_delay / max(1, total_waiting), 1)
            }
        except Exception as e:
            print(f"[SUMO] Error fetching live metrics for {junction_id}: {e}")
            return None

    def step_simulation(self):
        """
        Advances the SUMO simulator by a single step.
        """
        if self.connected and self.traci:
            try:
                self.traci.simulationStep()
            except Exception as e:
                print(f"[SUMO] Simulation step failed: {e}")
                self.connected = False

    def close_connection(self):
        """
        Safely closes the active SUMO connection interface.
        """
        if self.connected and self.traci:
            try:
                self.traci.close()
                self.connected = False
                print("[SUMO] Connection closed successfully.")
            except Exception:
                pass

# Singleton adapter instance
sumo_adapter = SumoAdapter()
