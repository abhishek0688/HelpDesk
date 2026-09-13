import sys
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database

client = TestClient(app)

class TestSupportDeskBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure database is seeded
        seed_database()

    def test_01_health_check(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")

    def test_02_get_dashboard_stats(self):
        response = client.get("/api/v1/dashboard/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["total_tickets"], 6)
        self.assertIn("open_tickets", data)
        self.assertIn("resolved_tickets", data)
        self.assertIn("sla_breached_tickets", data)
        self.assertIn("fcr_rate_percentage", data)

    def test_03_create_ticket_and_code_generation(self):
        new_ticket = {
            "title": "VPN client fails to establish tunnel with error 442",
            "description": "User cannot connect to corporate VPN from home. The client reports error 442: failed to enable virtual adapter.",
            "priority": "Critical",
            "category": "Network",
            "affected_device": "Dell XPS 15",
            "operating_system": "Windows 11",
            "app_version": "Cisco AnyConnect 4.10",
            "error_message": "Error 442: Failed to enable virtual adapter",
            "user_department": "David Vance / Sales"
        }
        response = client.post("/api/v1/tickets", json=new_ticket)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["ticket_code"].startswith("INC-"))
        self.assertEqual(data["status"], "Open")
        self.assertEqual(data["priority"], "Critical")
        self.assertEqual(data["sla_status"], "Within SLA")
        TestSupportDeskBackend.created_ticket_id = data["id"]

    def test_04_duplicate_detection(self):
        payload = {
            "title": "Cisco AnyConnect VPN connects but cannot reach internal subnets",
            "description": "Remote engineer connects to corporate VPN successfully but routing fails",
            "category": "Network",
            "affected_device": "MacBook Pro M2"
        }
        response = client.post("/api/v1/tickets/check-duplicate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["has_duplicates"])
        self.assertGreater(len(data["matches"]), 0)

    def test_05_add_troubleshooting_step(self):
        t_id = TestSupportDeskBackend.created_ticket_id
        step_payload = {
            "step_name": "Restart computer/application",
            "engineer_notes": "Restarted Windows and re-tested VPN launch. Error 442 persisted.",
            "result": "Unsuccessful"
        }
        response = client.post(f"/api/v1/tickets/{t_id}/troubleshooting", json=step_payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["result"], "Unsuccessful")

        # Ticket should now have transitioned to In Progress
        t_resp = client.get(f"/api/v1/tickets/{t_id}")
        self.assertEqual(t_resp.json()["status"], "In Progress")

    def test_06_rca_word_count_validation(self):
        t_id = TestSupportDeskBackend.created_ticket_id
        
        # Test rejection when > 100 words
        long_rca = "word " * 105
        bad_payload = {
            "rca_type": "Suspected",
            "root_cause": long_rca,
            "corrective_action": "Fix it"
        }
        bad_response = client.post(f"/api/v1/tickets/{t_id}/rca", json=bad_payload)
        self.assertIn(bad_response.status_code, [400, 422])

        # Test acceptance when <= 100 words
        valid_payload = {
            "rca_type": "Suspected",
            "root_cause": "Virtual network adapter service was disabled by third-party antivirus firewall hook during recent update.",
            "contributing_factors": "Antivirus software signature update.",
            "corrective_action": "Re-enabled Cisco virtual adapter service in services.msc.",
            "preventive_action": "Configure antivirus exclusions for VPN virtual network adapters."
        }
        good_response = client.post(f"/api/v1/tickets/{t_id}/rca", json=valid_payload)
        self.assertEqual(good_response.status_code, 201)
        self.assertEqual(good_response.json()["rca_type"], "Suspected")

    def test_07_rca_suggestion_endpoint(self):
        t_id = TestSupportDeskBackend.created_ticket_id
        response = client.post(f"/api/v1/tickets/{t_id}/rca/suggest")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("suggested_root_cause", data)
        self.assertLessEqual(len(data["suggested_root_cause"].split()), 100)

    def test_08_escalation_recommendation_and_escalate(self):
        t_id = TestSupportDeskBackend.created_ticket_id
        
        # Add another unsuccessful step to trigger recommendation
        client.post(f"/api/v1/tickets/{t_id}/troubleshooting", json={
            "step_name": "Check IP configuration",
            "engineer_notes": "Virtual adapter missing IP.",
            "result": "Unsuccessful"
        })

        rec_resp = client.get(f"/api/v1/tickets/{t_id}/escalation-recommendation")
        self.assertEqual(rec_resp.status_code, 200)
        self.assertTrue(rec_resp.json()["should_escalate"])

    def test_09_troubleshooting_analytics(self):
        response = client.get("/api/v1/analytics/troubleshooting")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total_troubleshooting_events"], 0)
        self.assertIsNotNone(data["most_used_step"])
        self.assertGreater(len(data["steps"]), 0)

    def test_10_resolve_and_save_to_kb(self):
        t_id = TestSupportDeskBackend.created_ticket_id
        
        # Resolve ticket
        res_payload = {
            "final_solution": "Re-enabled virtual network adapter service and reset TCP/IP stack.",
            "workaround": "Use web portal access.",
            "user_confirmation": True,
            "engineer_notes": "User confirmed VPN connection is stable."
        }
        res_resp = client.post(f"/api/v1/tickets/{t_id}/resolution", json=res_payload)
        self.assertEqual(res_resp.status_code, 201)

        # Ticket should now be Resolved
        t_resp = client.get(f"/api/v1/tickets/{t_id}")
        self.assertEqual(t_resp.json()["status"], "Resolved")
        self.assertEqual(t_resp.json()["sla_status"], "Completed")

        # Save as KB article
        kb_payload = {
            "ticket_id": t_id,
            "title": "Fixing Cisco VPN Error 442 Virtual Adapter Disabled",
            "category": "Network",
            "problem": "Cisco AnyConnect fails with error 442.",
            "final_solution": "Re-enable the Cisco Systems VPN Adapter in Device Manager.",
            "workaround": "Web VPN"
        }
        kb_resp = client.post("/api/v1/knowledge-base", json=kb_payload)
        self.assertEqual(kb_resp.status_code, 201)
        self.assertEqual(kb_resp.json()["title"], kb_payload["title"])

        # Check KB search
        search_resp = client.get("/api/v1/knowledge-base?search=Cisco")
        self.assertEqual(search_resp.status_code, 200)
        self.assertGreaterEqual(len(search_resp.json()), 1)

if __name__ == "__main__":
    unittest.main()
