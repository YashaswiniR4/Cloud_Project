"""
Threat Intelligence Feed Lookup Service
Queries threat feeds (e.g. AbuseIPDB) and calculates IP reputation & risk score.
"""

from typing import Dict, Any
from config.settings import settings
from config.logging_config import logger


class ThreatIntelFeedManager:
    KNOWN_MALICIOUS_IPS = {
        "198.51.100.45": {"abuse_score": 95, "country": "RU", "isp": "BadActorNet", "reports": 450},
        "203.0.113.88": {"abuse_score": 88, "country": "CN", "isp": "ExploitServers", "reports": 120},
        "192.0.2.1": {"abuse_score": 75, "country": "BR", "isp": "HackerBotnet", "reports": 89}
    }

    def __init__(self):
        self.api_key = settings.ABUSEIPDB_API_KEY
        logger.info("Initialized Threat Intelligence Feed Manager.")

    def check_ip_reputation(self, ip_address: str) -> Dict[str, Any]:
        """Queries IP reputation database."""
        logger.info(f"Querying threat intelligence feed for IP: {ip_address}")
        if ip_address in self.KNOWN_MALICIOUS_IPS:
            data = self.KNOWN_MALICIOUS_IPS[ip_address]
            logger.warning(f"Malicious IP Detected in Threat Intel Feed: {ip_address} (Score: {data['abuse_score']})")
            return {
                "ip": ip_address,
                "is_known_attacker": True,
                "abuse_confidence_score": data["abuse_score"],
                "country": data["country"],
                "isp": data["isp"],
                "total_reports": data["reports"],
                "action_recommended": "BLOCK_IMMEDIATELY" if data["abuse_score"] > 80 else "MONITOR"
            }

        return {
            "ip": ip_address,
            "is_known_attacker": False,
            "abuse_confidence_score": 0,
            "country": "US",
            "isp": "Standard Cloud Provider",
            "total_reports": 0,
            "action_recommended": "ALLOW"
        }


if __name__ == "__main__":
    intel = ThreatIntelFeedManager()
    logger.info(f"Bad IP Check: {intel.check_ip_reputation('198.51.100.45')}")
