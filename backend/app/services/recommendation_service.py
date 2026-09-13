from typing import List, Dict, Any

DEFAULT_TROUBLESHOOTING_STEPS = [
    {"step_name": "Restart computer/application", "description": "Perform a clean restart of the affected device or application process."},
    {"step_name": "Check power and physical connections", "description": "Ensure power cords, ethernet cables, and peripheral links are firmly connected."},
    {"step_name": "Check network connectivity", "description": "Verify link light, gateway ping, and local intranet communication."},
    {"step_name": "Check IP configuration", "description": "Run ipconfig /all to verify valid IPv4 address, subnet mask, and default gateway."},
    {"step_name": "Check user permissions", "description": "Verify Active Directory group memberships and local security policy privileges."},
    {"step_name": "Check software updates", "description": "Verify application version and pending OS/application update patches."},
    {"step_name": "Update/reinstall drivers", "description": "Check Device Manager for warnings and update to manufacturer certified drivers."},
    {"step_name": "Clear cache/temp files", "description": "Delete browser cache, %temp% files, and application cache databases."},
    {"step_name": "Check event logs", "description": "Inspect Windows Event Viewer (System and Application logs) for error events."},
    {"step_name": "Test another account/device", "description": "Isolate whether the problem follows the user profile or the physical workstation."},
    {"step_name": "Follow SOP/Knowledge Base", "description": "Cross-reference documented Standard Operating Procedures and KB articles."},
    {"step_name": "Check hardware", "description": "Inspect physical hardware health, RAM usage, hard drive SMART status, and temperatures."},
    {"step_name": "Reinstall application", "description": "Perform a clean uninstall and reinstall of the affected software binary."},
    {"step_name": "Perform security checks where appropriate", "description": "Run an on-demand endpoint antimalware scan and inspect firewall logs."}
]

CATEGORY_RECOMMENDATIONS = {
    "Network": [
        {"step_name": "Check Wi-Fi/network cable", "description": "Verify physical cable connection or Wi-Fi signal strength and SSID.", "category": "Network"},
        {"step_name": "Restart network adapter", "description": "Disable and re-enable network interface card in adapter settings.", "category": "Network"},
        {"step_name": "Check IP configuration", "description": "Run ipconfig /release and ipconfig /renew to obtain a valid IP.", "category": "Network"},
        {"step_name": "Test DNS", "description": "Run nslookup and ping internal domain controller and 8.8.8.8.", "category": "Network"},
        {"step_name": "Ping a known server", "description": "Ping the default gateway, corporate intranet server, and external gateway.", "category": "Network"}
    ],
    "Software": [
        {"step_name": "Restart application", "description": "End task in Task Manager and relaunch the application cleanly.", "category": "Software"},
        {"step_name": "Clear cache", "description": "Purge temporary application data and cached user session files.", "category": "Software"},
        {"step_name": "Check updates", "description": "Verify if a mandatory software release or cumulative patch is pending.", "category": "Software"},
        {"step_name": "Repair/reinstall application", "description": "Run the setup installer repair wizard or reinstall the application.", "category": "Software"},
        {"step_name": "Check application logs", "description": "Review log files in %localappdata% or Event Viewer for unhandled exceptions.", "category": "Software"}
    ],
    "Hardware": [
        {"step_name": "Check connections", "description": "Reseat power, HDMI/DisplayPort, USB, and peripheral cables firmly.", "category": "Hardware"},
        {"step_name": "Test another cable/port", "description": "Isolate potential port or cabling defects using known-good hardware.", "category": "Hardware"},
        {"step_name": "Check Device Manager", "description": "Look for yellow exclamation marks or disabled hardware devices.", "category": "Hardware"},
        {"step_name": "Update drivers", "description": "Download and install official OEM hardware drivers.", "category": "Hardware"},
        {"step_name": "Test another system", "description": "Connect peripheral to a secondary machine to confirm hardware viability.", "category": "Hardware"}
    ],
    "Operating System": [
        {"step_name": "Check event logs", "description": "Review Event Viewer System and Application logs for critical crash errors.", "category": "Operating System"},
        {"step_name": "Run system file checker", "description": "Execute sfc /scannow and DISM /Online /Cleanup-Image /RestoreHealth.", "category": "Operating System"},
        {"step_name": "Check disk space & health", "description": "Verify C: drive free space and review drive health via CHKDSK / SMART.", "category": "Operating System"},
        {"step_name": "Review recent updates", "description": "Check if an OS cumulative update was installed prior to the incident.", "category": "Operating System"},
        {"step_name": "Restart computer", "description": "Perform a complete system reboot to clear kernel cache and processes.", "category": "Operating System"}
    ],
    "Access": [
        {"step_name": "Check user permissions", "description": "Review Active Directory security group memberships and file ACLs.", "category": "Access"},
        {"step_name": "Verify Active Directory account status", "description": "Check if user account is locked out, disabled, or expired.", "category": "Access"},
        {"step_name": "Clear cached credentials", "description": "Open Windows Credential Manager and remove stale stored credentials.", "category": "Access"},
        {"step_name": "Test another account/device", "description": "Have user test login on an alternative device to rule out profile corruption.", "category": "Access"},
        {"step_name": "Verify MFA tokens", "description": "Check Microsoft/Duo Authenticator time-sync and registered mobile devices.", "category": "Access"}
    ],
    "Security": [
        {"step_name": "Run endpoint security scan", "description": "Perform a full system antimalware and EDR endpoint scan.", "category": "Security"},
        {"step_name": "Check firewall/proxy rules", "description": "Inspect local firewall exceptions and corporate web proxy block alerts.", "category": "Security"},
        {"step_name": "Check event logs", "description": "Inspect Security event logs for Event IDs 4625 (failed login) or privilege escalation.", "category": "Security"},
        {"step_name": "Verify SSL/TLS certificates", "description": "Check for expired SSL root certificates in local machine certificate store.", "category": "Security"},
        {"step_name": "Perform security checks where appropriate", "description": "Verify host isolation status and check process hash against threat intelligence.", "category": "Security"}
    ]
}

def get_recommendations_for_category(category: str) -> List[Dict[str, Any]]:
    """
    Returns specific recommended troubleshooting actions for the given category.
    Falls back to common software/network steps if category is Other.
    """
    cat = category.title() if category else "Software"
    return CATEGORY_RECOMMENDATIONS.get(cat, CATEGORY_RECOMMENDATIONS["Software"])

def evaluate_escalation_recommendation(ticket, troubleshooting_steps: list) -> Dict[str, Any]:
    """
    Smart escalation recommendation logic (Rule-based).
    Checks:
    1. Is issue unresolved?
    2. Were 2 or more troubleshooting attempts marked Unsuccessful?
    3. Is SLA near breach or breached?
    4. Is it Critical priority or requires Tier-2 domain access?
    """
    if ticket.status in ["Resolved", "Closed", "Escalated L2"]:
        return {
            "should_escalate": False,
            "reason": f"Ticket is already in '{ticket.status}' state.",
            "recommended_team": "None"
        }

    unsuccessful_steps = [s for s in troubleshooting_steps if s.result == "Unsuccessful"]
    has_failed_attempts = len(unsuccessful_steps) >= 2
    is_sla_threatened = ticket.sla_status in ["Near Breach", "Breached"]
    is_critical = ticket.priority == "Critical"

    recommended_team_map = {
        "Network": "Network Tier-2",
        "Software": "Application Support Tier-2",
        "Hardware": "Desktop Field Engineering",
        "Operating System": "Systems & Storage Tier-2",
        "Access": "Identity & Access Management (IAM)",
        "Security": "Security Operations Center (SOC)",
        "Other": "Senior Technical Support Tier-2"
    }
    recommended_team = recommended_team_map.get(ticket.category, "Senior Technical Support Tier-2")

    reasons = []
    if has_failed_attempts:
        reasons.append(f"{len(unsuccessful_steps)} troubleshooting steps were unsuccessful.")
    if is_sla_threatened:
        reasons.append(f"Ticket SLA is currently '{ticket.sla_status}'.")
    if is_critical:
        reasons.append("High severity / Critical priority incident requires specialized attention.")

    if has_failed_attempts or is_sla_threatened or (is_critical and len(troubleshooting_steps) >= 1):
        full_reason = " ".join(reasons) or "Multiple baseline troubleshooting steps exhausted without resolution."
        return {
            "should_escalate": True,
            "reason": f"Recommended Action: Escalate to L2. {full_reason}",
            "recommended_team": recommended_team
        }

    return {
        "should_escalate": False,
        "reason": "Standard Level 1 troubleshooting steps are still in progress. Continue following recommended checklist.",
        "recommended_team": recommended_team
    }
