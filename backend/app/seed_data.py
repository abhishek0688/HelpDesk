import datetime
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.ticket import Ticket
from app.models.troubleshooting import TroubleshootingStep
from app.models.rca import RCARecord
from app.models.resolution import ResolutionRecord
from app.models.escalation import EscalationRecord
from app.models.kb import KnowledgeBaseArticle
from app.models.activity import TicketActivityLog
from app.services.sla_service import calculate_sla_deadline, evaluate_sla_status

def seed_database():
    """
    Populates realistic sample data for interview demonstrations.
    Includes tickets across various categories, troubleshooting histories,
    RCA records, escalations, resolutions, and knowledge base articles.
    """
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Ticket).first():
            print("Database already contains tickets. Skipping seed.")
            return

        print("Seeding database with realistic demonstration data...")
        now = datetime.datetime.utcnow()

        # --- TICKET 1: Internet connectivity issue (Resolved) ---
        t1_created = now - datetime.timedelta(hours=6)
        t1 = Ticket(
            ticket_code="INC-1001",
            title="Unable to connect to office Wi-Fi network",
            description="Laptop disconnects from corporate SSID 'Corp-Secure' every few minutes and reports 'No Internet, Secured'. User cannot access intranet or web services.",
            priority="High",
            category="Network",
            affected_device="Dell Latitude 5420 (Asset #DL-9821)",
            operating_system="Windows 11 Enterprise",
            app_version="Intel Wi-Fi 6 AX201 Driver v22.10",
            error_message="DNS_PROBE_FINISHED_NO_INTERNET",
            user_department="Sarah Jenkins / Finance",
            status="Resolved",
            sla_deadline=t1_created + datetime.timedelta(hours=4),
            sla_status="Completed",
            is_escalated=False,
            created_at=t1_created,
            updated_at=now - datetime.timedelta(hours=2)
        )
        db.add(t1)
        db.commit()
        db.refresh(t1)

        # Troubleshooting steps for T1
        s1_1 = TroubleshootingStep(
            ticket_id=t1.id,
            step_name="Restart computer/application",
            engineer_notes="Rebooted Windows 11 laptop. Issue persisted immediately upon reconnecting to Wi-Fi.",
            result="Unsuccessful",
            performed_at=t1_created + datetime.timedelta(minutes=15)
        )
        s1_2 = TroubleshootingStep(
            ticket_id=t1.id,
            step_name="Check IP configuration",
            engineer_notes="Ran ipconfig /all. Observed 169.254.x.x APIPA address, indicating DHCP lease failure.",
            result="Unsuccessful",
            performed_at=t1_created + datetime.timedelta(minutes=30)
        )
        s1_3 = TroubleshootingStep(
            ticket_id=t1.id,
            step_name="Update/reinstall drivers",
            engineer_notes="Updated Intel Wi-Fi driver from local offline repository and flushed DNS. Adapter obtained 10.10.42.115 DHCP address successfully.",
            result="Successful",
            performed_at=t1_created + datetime.timedelta(hours=1, minutes=10)
        )
        db.add_all([s1_1, s1_2, s1_3])

        # RCA for T1 (strictly <= 100 words)
        rca1 = RCARecord(
            ticket_id=t1.id,
            rca_type="Confirmed",
            root_cause="Outdated Intel Wi-Fi 6 AX201 adapter driver failed to handle 802.11ax WPA3 enterprise roaming handshakes, causing DHCP timeout.",
            contributing_factors="Recent corporate access point firmware update enabled mandatory PMF (Protected Management Frames); workstation driver was unpatched.",
            corrective_action="Updated network adapter driver to verified OEM version 22.250.0 and verified continuous ping response.",
            preventive_action="Push automated Wi-Fi driver updates via Microsoft Intune ring deployment.",
            created_at=t1_created + datetime.timedelta(hours=1, minutes=30)
        )
        db.add(rca1)

        # Resolution for T1
        res1 = ResolutionRecord(
            ticket_id=t1.id,
            troubleshooting_summary="Rebooted laptop (unsuccessful); inspected IP config (APIPA observed); updated Wi-Fi driver and flushed DNS (successful).",
            final_solution="Upgraded Wi-Fi network adapter driver to version 22.250.0 and renewed DHCP lease. Tested sustained connectivity for 30 minutes without dropouts.",
            workaround="Temporarily utilized USB-C Gigabit Ethernet dock while driver was downloading.",
            user_confirmation=True,
            engineer_notes="User confirmed Microsoft 365, Teams, and SAP ERP access fully restored.",
            resolved_at=now - datetime.timedelta(hours=2)
        )
        db.add(res1)

        # Activity logs for T1
        db.add(TicketActivityLog(ticket_id=t1.id, activity="Ticket Created", description="Ticket INC-1001 created.", timestamp=t1_created))
        db.add(TicketActivityLog(ticket_id=t1.id, activity="Troubleshooting: Restart computer/application", description="Result: Unsuccessful", timestamp=t1_created + datetime.timedelta(minutes=15)))
        db.add(TicketActivityLog(ticket_id=t1.id, activity="Troubleshooting: Update/reinstall drivers", description="Result: Successful", timestamp=t1_created + datetime.timedelta(hours=1, minutes=10)))
        db.add(TicketActivityLog(ticket_id=t1.id, activity="RCA Recorded", description="RCA Confirmed: Wi-Fi driver compatibility failure.", timestamp=t1_created + datetime.timedelta(hours=1, minutes=30)))
        db.add(TicketActivityLog(ticket_id=t1.id, activity="Ticket Resolved", description="Ticket marked Resolved with user confirmation.", timestamp=now - datetime.timedelta(hours=2)))


        # --- TICKET 2: Outlook not opening (In Progress) ---
        t2_created = now - datetime.timedelta(hours=2)
        t2 = Ticket(
            ticket_code="INC-1002",
            title="Outlook crashes on startup with 'Cannot start Microsoft Outlook'",
            description="User clicks desktop Outlook icon; splash screen displays 'Loading Profile' for 10 seconds, then terminates abruptly with an error dialog.",
            priority="Medium",
            category="Software",
            affected_device="Lenovo ThinkPad X1 Carbon (Asset #LP-4011)",
            operating_system="Windows 10 Enterprise 22H2",
            app_version="Microsoft 365 Apps for Enterprise v2308",
            error_message="Cannot start Microsoft Outlook. Cannot open the Outlook window. The set of folders cannot be opened.",
            user_department="Marcus Vance / Legal",
            status="In Progress",
            sla_deadline=t2_created + datetime.timedelta(hours=8),
            sla_status="Within SLA",
            is_escalated=False,
            created_at=t2_created,
            updated_at=now - datetime.timedelta(minutes=45)
        )
        db.add(t2)
        db.commit()
        db.refresh(t2)

        s2_1 = TroubleshootingStep(
            ticket_id=t2.id,
            step_name="Restart computer/application",
            engineer_notes="Ended Outlook background processes in Task Manager and restarted PC. Still failed to launch.",
            result="Unsuccessful",
            performed_at=t2_created + datetime.timedelta(minutes=20)
        )
        s2_2 = TroubleshootingStep(
            ticket_id=t2.id,
            step_name="Follow SOP/Knowledge Base",
            engineer_notes="Executed 'outlook.exe /safe'. Outlook opened successfully in Safe Mode, pointing to a faulty COM add-in.",
            result="Successful",
            performed_at=t2_created + datetime.timedelta(minutes=50)
        )
        db.add_all([s2_1, s2_2])

        db.add(TicketActivityLog(ticket_id=t2.id, activity="Ticket Created", description="Ticket INC-1002 created.", timestamp=t2_created))
        db.add(TicketActivityLog(ticket_id=t2.id, activity="Troubleshooting: Follow SOP/Knowledge Base", description="Outlook opened in Safe Mode. Suspected COM Add-in.", timestamp=t2_created + datetime.timedelta(minutes=50)))


        # --- TICKET 3: Printer not working (Resolved) ---
        t3_created = now - datetime.timedelta(hours=14)
        t3 = Ticket(
            ticket_code="INC-1003",
            title="HP LaserJet print jobs stuck in spooler queue",
            description="Marketing team cannot print payroll flyers. All submitted print jobs show 'Error - Printing' in the queue.",
            priority="Medium",
            category="Hardware",
            affected_device="HP LaserJet Enterprise M608 (IP: 10.10.50.25)",
            operating_system="Windows Server 2022 Print Server",
            app_version="HP Universal Print Driver v7.1.0",
            error_message="Print Spooler Service unresponsive; Error 0x0000007b",
            user_department="Robert Chen / Marketing",
            status="Resolved",
            sla_deadline=t3_created + datetime.timedelta(hours=8),
            sla_status="Completed",
            is_escalated=False,
            created_at=t3_created,
            updated_at=t3_created + datetime.timedelta(hours=3)
        )
        db.add(t3)
        db.commit()
        db.refresh(t3)

        s3_1 = TroubleshootingStep(
            ticket_id=t3.id,
            step_name="Check power and physical connections",
            engineer_notes="Printer powered on, ready light solid green, network port blinking amber.",
            result="Inconclusive",
            performed_at=t3_created + datetime.timedelta(minutes=30)
        )
        s3_2 = TroubleshootingStep(
            ticket_id=t3.id,
            step_name="Clear cache/temp files",
            engineer_notes="Stopped Print Spooler service, cleared C:\\Windows\\System32\\spool\\PRINTERS, and restarted service. Test page printed successfully.",
            result="Successful",
            performed_at=t3_created + datetime.timedelta(hours=2)
        )
        db.add_all([s3_1, s3_2])

        rca3 = RCARecord(
            ticket_id=t3.id,
            rca_type="Confirmed",
            root_cause="A corrupt 85MB PDF graphic document corrupted the local spooler shadow file (.SHD), blocking subsequent FIFO print processing.",
            contributing_factors="Oversized vector graphic sent without rasterization; print spooler lack of automatic corrupted job purging.",
            corrective_action="Purged damaged .SHD and .SPL files from the printer spool directory and restarted spooler service.",
            preventive_action="Configured print queue timeout threshold and deployed client-side rendering policy.",
            created_at=t3_created + datetime.timedelta(hours=2, minutes=20)
        )
        db.add(rca3)

        res3 = ResolutionRecord(
            ticket_id=t3.id,
            troubleshooting_summary="Verified network status; cleared corrupt spooler queue and restarted service.",
            final_solution="Flushed stuck print queue in Windows Spooler directory, restarted spooler service, and re-printed document queue.",
            workaround="Direct PDF export to cloud printer backup.",
            user_confirmation=True,
            engineer_notes="Test page printed and user verified receipt of documents.",
            resolved_at=t3_created + datetime.timedelta(hours=2, minutes=45)
        )
        db.add(res3)

        db.add(TicketActivityLog(ticket_id=t3.id, activity="Ticket Created", description="Ticket INC-1003 logged.", timestamp=t3_created))
        db.add(TicketActivityLog(ticket_id=t3.id, activity="Troubleshooting: Clear cache/temp files", description="Result: Successful", timestamp=t3_created + datetime.timedelta(hours=2)))
        db.add(TicketActivityLog(ticket_id=t3.id, activity="Ticket Resolved", description="Resolved print queue jam.", timestamp=t3_created + datetime.timedelta(hours=2, minutes=45)))


        # --- TICKET 4: Windows login issue (Resolved) ---
        t4_created = now - datetime.timedelta(hours=5)
        t4 = Ticket(
            ticket_code="INC-1004",
            title="User locked out after password reset",
            description="Employee changed Active Directory password on morning portal; laptop logon screen repeatedly denies entry with 'The referenced account is currently locked out'.",
            priority="High",
            category="Access",
            affected_device="HP EliteBook 840 G8",
            operating_system="Windows 11 Pro",
            app_version="N/A",
            error_message="The referenced account is currently locked out and may not be logged on to.",
            user_department="Priya Patel / Human Resources",
            status="Resolved",
            sla_deadline=t4_created + datetime.timedelta(hours=4),
            sla_status="Completed",
            is_escalated=False,
            created_at=t4_created,
            updated_at=t4_created + datetime.timedelta(minutes=40)
        )
        db.add(t4)
        db.commit()
        db.refresh(t4)

        s4_1 = TroubleshootingStep(
            ticket_id=t4.id,
            step_name="Check user permissions",
            engineer_notes="Inspected Active Directory Users & Computers. Account status: Locked Out due to 6 invalid authentication attempts.",
            result="Unsuccessful",
            performed_at=t4_created + datetime.timedelta(minutes=10)
        )
        s4_2 = TroubleshootingStep(
            ticket_id=t4.id,
            step_name="Follow SOP/Knowledge Base",
            engineer_notes="Identified user's mobile phone mail app was submitting cached old password. Turned off mobile Wi-Fi, unlocked AD account, and updated phone password.",
            result="Successful",
            performed_at=t4_created + datetime.timedelta(minutes=30)
        )
        db.add_all([s4_1, s4_2])

        rca4 = RCARecord(
            ticket_id=t4.id,
            rca_type="Confirmed",
            root_cause="User's personal mobile phone mail client repeatedly attempted Exchange ActiveSync authentication with obsolete cached password, triggering AD lockout threshold.",
            contributing_factors="Password change on web portal did not prompt automatic re-authentication prompt on native iOS Mail.",
            corrective_action="Unlocked AD account and updated credentials on mobile device.",
            preventive_action="Distribute Intune Modern Authentication profile enforcing interactive OAuth prompts upon AD password changes.",
            created_at=t4_created + datetime.timedelta(minutes=35)
        )
        db.add(rca4)

        res4 = ResolutionRecord(
            ticket_id=t4.id,
            troubleshooting_summary="Checked AD lockout logs; discovered smartphone ActiveSync lock; unlocked account and synced phone.",
            final_solution="Unlocked account in Domain Controller and assisted user with credential sync across laptop and smartphone.",
            workaround="None needed.",
            user_confirmation=True,
            engineer_notes="User logged in on both devices successfully.",
            resolved_at=t4_created + datetime.timedelta(minutes=40)
        )
        db.add(res4)


        # --- TICKET 5: Slow computer (Open) ---
        t5_created = now - datetime.timedelta(hours=1)
        t5 = Ticket(
            ticket_code="INC-1005",
            title="Workstation experiencing severe system latency and 100% disk usage",
            description="System response time is sluggish; opening applications takes up to 4 minutes. Windows Task Manager reports constant 100% active disk time on C: drive.",
            priority="Medium",
            category="Operating System",
            affected_device="Dell OptiPlex 7090 (Asset #DT-3021)",
            operating_system="Windows 10 Enterprise",
            app_version="OS Build 19045.3803",
            error_message="System event warning: 'The disk transfer time took 12500ms'",
            user_department="David Kim / Logistics",
            status="Open",
            sla_deadline=t5_created + datetime.timedelta(hours=8),
            sla_status="Within SLA",
            is_escalated=False,
            created_at=t5_created,
            updated_at=t5_created
        )
        db.add(t5)
        db.commit()
        db.refresh(t5)

        db.add(TicketActivityLog(ticket_id=t5.id, activity="Ticket Created", description="Ticket INC-1005 opened.", timestamp=t5_created))


        # --- TICKET 6: VPN connection issue (Escalated L2) ---
        t6_created = now - datetime.timedelta(hours=3)
        t6 = Ticket(
            ticket_code="INC-1006",
            title="Cisco AnyConnect VPN connects but cannot reach internal subnets",
            description="Remote engineer connects to corporate VPN successfully; tunnel IP is assigned, but all routing to 10.200.0.0/16 development environment fails with ping request timeout.",
            priority="Critical",
            category="Network",
            affected_device="MacBook Pro M2 (Asset #MB-1092)",
            operating_system="macOS Sonoma 14.3",
            app_version="Cisco Secure Client v5.0.03072",
            error_message="Routing table failure: Destination host unreachable via tun0",
            user_department="Elena Rostova / Senior Software Engineer",
            status="Escalated L2",
            sla_deadline=t6_created + datetime.timedelta(hours=2),
            sla_status="Breached",
            is_escalated=True,
            created_at=t6_created,
            updated_at=now - datetime.timedelta(minutes=30)
        )
        db.add(t6)
        db.commit()
        db.refresh(t6)

        s6_1 = TroubleshootingStep(
            ticket_id=t6.id,
            step_name="Restart computer/application",
            engineer_notes="Restarted AnyConnect client and macOS workstation. Tunnel established but routing remained unreachable.",
            result="Unsuccessful",
            performed_at=t6_created + datetime.timedelta(minutes=25)
        )
        s6_2 = TroubleshootingStep(
            ticket_id=t6.id,
            step_name="Check IP configuration",
            engineer_notes="Inspected netstat -rn routing tables. Split-tunnel route for 10.200.0.0/16 is missing from VPN profile pushed by headend ASA.",
            result="Unsuccessful",
            performed_at=t6_created + datetime.timedelta(minutes=55)
        )
        db.add_all([s6_1, s6_2])

        esc6 = EscalationRecord(
            ticket_id=t6.id,
            reason="Split-tunnel Access Control List on the corporate Cisco ASA firewall is missing subnet routes for new AWS DirectConnect VPC (10.200.0.0/16). Requires firewall administrator privilege.",
            l2_team="Network Tier-2",
            priority="Critical",
            notes="Level 1 engineer confirmed client-side routing table is correct according to policy. ASA Group Policy 'Engineering-Remote-Access' requires route entry addition.",
            escalated_at=now - datetime.timedelta(minutes=30)
        )
        db.add(esc6)

        db.add(TicketActivityLog(ticket_id=t6.id, activity="Ticket Created", description="Ticket INC-1006 created as Critical priority.", timestamp=t6_created))
        db.add(TicketActivityLog(ticket_id=t6.id, activity="Troubleshooting: Check IP configuration", description="Result: Unsuccessful. Identified missing ASA route.", timestamp=t6_created + datetime.timedelta(minutes=55)))
        db.add(TicketActivityLog(ticket_id=t6.id, activity="Escalated to L2", description="Escalated to Network Tier-2 due to firewall ACL modification requirements.", timestamp=now - datetime.timedelta(minutes=30)))


        # --- SAMPLE KNOWLEDGE BASE ARTICLES ---
        kb1 = KnowledgeBaseArticle(
            ticket_id=t1.id,
            title="Resolving Intel Wi-Fi 6 Adapter Roaming & DHCP APIPA Failures",
            category="Network",
            problem="Workstation repeatedly disconnects from enterprise 802.1X Wi-Fi networks and assigns a self-assigned 169.254.x.x APIPA address.",
            symptoms="Notification 'No Internet, Secured'; ping to default gateway fails; Event Viewer shows Netwtw10 Event 5002.",
            root_cause="Outdated OEM network drivers do not support WPA3 Protected Management Frames (PMF) handshakes during BSSID transition.",
            troubleshooting_steps="1. Open Device Manager -> Network Adapters -> Intel Wi-Fi.\n2. Note driver version.\n3. Run 'ipconfig /release' and 'ipconfig /renew'.\n4. Install latest certified Intel driver package.",
            final_solution="Update Intel Wi-Fi driver to version 22.250.0 or higher. In Advanced Adapter Properties, set '802.11a/b/g Wireless Mode' to Dual Band and flush local DNS cache.",
            workaround="Use Ethernet cable or external USB Wi-Fi dongle until driver update completes.",
            preventive_action="Package and distribute driver updates via Microsoft Intune ring deployment.",
            created_at=now - datetime.timedelta(hours=2)
        )

        kb2 = KnowledgeBaseArticle(
            ticket_id=t3.id,
            title="How to Clear Stalled Print Spooler Queue in Windows",
            category="Hardware",
            problem="Print jobs remain stuck in queue with status 'Error - Printing' and cannot be cancelled or deleted normally.",
            symptoms="All users unable to print; spoolsv.exe consumes high CPU; printers appear offline.",
            root_cause="Corrupted spool file (.SHD or .SPL) locks the spooler RPC port, preventing FIFO processing.",
            troubleshooting_steps="1. Open Command Prompt as Administrator.\n2. Run 'net stop spooler'.\n3. Navigate to 'C:\\Windows\\System32\\spool\\PRINTERS'.\n4. Delete all files inside folder.\n5. Run 'net start spooler'.",
            final_solution="Execute the administrative purge script to stop spoolsv.exe, delete locked .SPL and .SHD queue files, and restart the spooler service.",
            workaround="Print directly to network IP port or export document as PDF for web submission.",
            preventive_action="Enable 'Render print jobs on client computers' in printer sharing settings to avoid central spool server overloading.",
            created_at=now - datetime.timedelta(hours=1)
        )

        kb3 = KnowledgeBaseArticle(
            ticket_id=None,
            title="Troubleshooting Microsoft Outlook Safe Mode and COM Add-ins",
            category="Software",
            problem="Microsoft Outlook crashes immediately on splash screen during 'Loading Profile' stage.",
            symptoms="Application event log Event ID 1000 with faulting module 'OUTLOOK.EXE'.",
            root_cause="Incompatible third-party COM add-ins (e.g. anti-spam, Adobe PDF, or web meeting plugins) causing memory violation.",
            troubleshooting_steps="1. Press Win + R and type 'outlook.exe /safe'.\n2. If Outlook opens, navigate to File -> Options -> Add-ins.\n3. Select Manage: COM Add-ins -> Go.\n4. Uncheck non-Microsoft add-ins one by one.",
            final_solution="Disable unverified COM add-ins, restart Outlook normally, and reinstall or update offending third-party extension.",
            workaround="Access webmail via Outlook Web Access (portal.office.com) in browser.",
            preventive_action="Restrict installation of unmanaged COM add-ins through Active Directory GPO.",
            created_at=now - datetime.timedelta(days=2)
        )

        db.add_all([kb1, kb2, kb3])
        db.commit()
        print("Database seeded successfully with realistic data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
