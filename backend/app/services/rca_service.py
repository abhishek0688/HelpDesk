from typing import List, Dict, Any

def generate_rca_suggestion(
    category: str,
    title: str,
    description: str,
    error_message: str = None,
    troubleshooting_steps: List[Dict[str, Any]] = None
) -> Dict[str, str]:
    """
    Generates a realistic Root Cause Analysis (RCA) hypothesis using rule-based heuristics.
    
    Beginner / Interview Note:
    This service analyzes incident attributes, error codes, and troubleshooting results.
    It returns a structured proposal with a concise root cause strictly <= 100 words.
    In an advanced iteration, this function can directly call an LLM (e.g. OpenAI / Anthropic / Gemini).
    """
    text = f"{title} {description} {error_message or ''}".lower()
    cat = (category or "").lower()
    
    # Check troubleshooting outcomes
    has_failed_restart = False
    has_failed_network = False
    if troubleshooting_steps:
        for s in troubleshooting_steps:
            name = s.get("step_name", "").lower()
            res = s.get("result", "").lower()
            if "restart" in name and res == "unsuccessful":
                has_failed_restart = True
            if ("network" in name or "ip" in name or "dns" in name) and res == "unsuccessful":
                has_failed_network = True

    # Category and keyword matching
    if "network" in cat or "wifi" in text or "dns" in text or "connection" in text or "vpn" in text:
        if "dns" in text or "resolve" in text:
            root_cause = "DNS server query failure due to misconfigured primary DNS suffix or expired DHCP DNS cache on the workstation adapter."
            factors = "Outdated DHCP lease; local DNS cache corruption; remote DNS resolver timeout."
            corrective = "Flush local DNS cache (ipconfig /flushdns) and rebind network adapter to verified corporate DNS servers (8.8.8.8 / 1.1.1.1 or internal AD DNS)."
            preventive = "Enforce standardized DHCP DNS distribution policies via Active Directory Group Policy."
        elif "vpn" in text:
            root_cause = "VPN client handshake timeout caused by split-tunnel gateway routing collision and stale IPSec security association."
            factors = "Local ISP MTU mismatch; outdated VPN client version; stale certificate."
            corrective = "Clear stored VPN tunnel profiles, reset TCP/IP stack (netsh int ip reset), and reconnect using standard SSL port 443 fallback."
            preventive = "Automate VPN client updates and distribute redundant split-tunnel gateway routes."
        else:
            root_cause = "Network interface card failure to negotiate IP address due to DHCP server pool exhaustion on the local subnet."
            factors = "Excessive active leases in DHCP scope; outdated network adapter drivers."
            corrective = "Renew IP lease via DHCP, update network adapter driver to certified OEM release, and verify Ethernet link speed/duplex."
            preventive = "Implement DHCP scope monitoring alerts when address usage exceeds 85%."

    elif "software" in cat or "crash" in text or "outlook" in text or "application" in text:
        if "outlook" in text or "pst" in text or "mail" in text:
            root_cause = "Corrupted user profile data file (OST/PST) and conflicting third-party COM add-ins causing heap memory exception."
            factors = "Improper system shutdown during active mailbox synchronization; incompatible security add-in."
            corrective = "Run Outlook in Safe Mode, disable unverified COM add-ins, and rebuild the local OST caching file from Exchange."
            preventive = "Configure centralized retention policies and scheduled OST integrity checks."
        else:
            root_cause = "Application runtime crash triggered by missing prerequisite .NET runtime dependency and corrupted localized application cache files."
            factors = "Incomplete background software patch; insufficient write permissions to user AppData directory."
            corrective = "Clear user temporary and local application cache, reinstall the required runtime dependencies, and repair the application installation."
            preventive = "Enforce verified deployment packages through Endpoint Management (SCCM/Intune)."

    elif "hardware" in cat or "printer" in text or "usb" in text or "device" in text:
        if "printer" in text or "spooler" in text:
            root_cause = "Stalled print spooler service caused by corrupted document queue file locking the printer driver RPC port."
            factors = "Oversized graphic document submitted; out-of-date generic PCL driver."
            corrective = "Stop Windows Print Spooler service, purge %SystemRoot%\\System32\\spool\\PRINTERS directory, and restart the spooler service."
            preventive = "Deploy certified Type-4 manufacturer print drivers across all networked workstations."
        else:
            root_cause = "Hardware peripheral communication breakdown caused by loose interface cabling and outdated chipset USB controller firmware."
            factors = "Physical port wear and tear; power management setting suspending USB root hubs."
            corrective = "Reseat cabling in an alternative high-speed port, disable USB selective suspend in Power Options, and update chipset drivers."
            preventive = "Include peripheral cable integrity checks during annual preventive maintenance audits."

    elif "access" in cat or "login" in text or "password" in text or "permission" in text or "locked" in text:
        root_cause = "Active Directory user authentication failure triggered by cached credential mismatch after recent password expiration."
        factors = "Multiple stored credentials on secondary mobile devices; AD domain controller replication delay."
        corrective = "Unlock account in Active Directory Users & Computers, clear Windows Credential Manager vault, and perform interactive domain re-login."
        preventive = "Configure automated password expiration reminder notifications 14 days in advance."

    elif "security" in cat or "virus" in text or "firewall" in text or "blocked" in text:
        root_cause = "Host firewall inspection policy blocked inbound traffic due to an unregistered socket listener port."
        factors = "Recent zero-trust endpoint policy push; unapproved application port request."
        corrective = "Inspect endpoint EDR security logs, create an explicit firewall exception rule for authorized binary, and re-test."
        preventive = "Maintain an approved application port matrix in the centralized configuration management database."

    else:
        root_cause = f"System instability and intermittent failure resulting from unhandled process state exceptions in {category or 'the system'}."
        factors = "Resource contention during peak business hours; pending system reboot following automated OS patch updates."
        corrective = "Perform clean graceful restart of affected services, inspect Event Viewer application logs, and re-verify normal operation."
        preventive = "Schedule automated maintenance reboots and maintain standard operating procedure documentation."

    # Validate that root_cause is strictly <= 100 words
    words = root_cause.strip().split()
    if len(words) > 100:
        root_cause = " ".join(words[:100])

    return {
        "suggested_root_cause": root_cause,
        "contributing_factors": factors,
        "corrective_action": corrective,
        "preventive_action": preventive,
        "explanation": "Rule-based heuristic analysis based on category, symptoms, and troubleshooting step outcomes."
    }
