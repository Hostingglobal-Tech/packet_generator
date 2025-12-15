#!/usr/bin/env python3
"""
Packet data structure and serialization module.
Defines the packet format for communication between client and server.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any


class PacketType:
    """Supported packet types"""
    TCP = "TCP"
    UDP = "UDP"
    ICMP = "ICMP"
    HTTP = "HTTP"

    @classmethod
    def all(cls) -> List[str]:
        return [cls.TCP, cls.UDP, cls.ICMP, cls.HTTP]


class Packet:
    """
    Packet data structure for network packet simulation.

    Attributes:
        id: Unique packet identifier (UUID)
        timestamp: ISO8601 timestamp of packet creation
        packet_type: Type of packet (TCP/UDP/ICMP/HTTP)
        source_ip: Source IP address
        source_port: Source port number
        dest_ip: Destination IP address
        dest_port: Destination port number
        size: Packet size in bytes
        payload: Packet payload data (string)
        flags: TCP flags or other protocol-specific flags
        ttl: Time to live
        protocol: Protocol name
        sequence: Sequence number (for ordered packets)
    """

    def __init__(
        self,
        packet_type: str,
        source_ip: str,
        source_port: int,
        dest_ip: str,
        dest_port: int,
        size: int = 64,
        payload: str = "",
        flags: Optional[List[str]] = None,
        ttl: int = 64,
        protocol: str = "IPv4",
        sequence: int = 0
    ):
        self.id = str(uuid.uuid4())
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.packet_type = packet_type
        self.source_ip = source_ip
        self.source_port = source_port
        self.dest_ip = dest_ip
        self.dest_port = dest_port
        self.size = size
        self.payload = payload
        self.flags = flags or []
        self.ttl = ttl
        self.protocol = protocol
        self.sequence = sequence

    def to_dict(self) -> Dict[str, Any]:
        """Convert packet to dictionary"""
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "type": self.packet_type,
            "source": {
                "ip": self.source_ip,
                "port": self.source_port
            },
            "destination": {
                "ip": self.dest_ip,
                "port": self.dest_port
            },
            "size": self.size,
            "payload": self.payload,
            "flags": self.flags,
            "metadata": {
                "ttl": self.ttl,
                "protocol": self.protocol,
                "sequence": self.sequence
            }
        }

    def to_json(self) -> str:
        """Serialize packet to JSON string"""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Packet':
        """Create packet from dictionary"""
        packet = cls(
            packet_type=data["type"],
            source_ip=data["source"]["ip"],
            source_port=data["source"]["port"],
            dest_ip=data["destination"]["ip"],
            dest_port=data["destination"]["port"],
            size=data.get("size", 64),
            payload=data.get("payload", ""),
            flags=data.get("flags", []),
            ttl=data.get("metadata", {}).get("ttl", 64),
            protocol=data.get("metadata", {}).get("protocol", "IPv4"),
            sequence=data.get("metadata", {}).get("sequence", 0)
        )
        # Restore original ID and timestamp
        packet.id = data["id"]
        packet.timestamp = data["timestamp"]
        return packet

    @classmethod
    def from_json(cls, json_str: str) -> 'Packet':
        """Deserialize packet from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)

    def __str__(self) -> str:
        """String representation for display"""
        return (
            f"[{self.packet_type}] {self.source_ip}:{self.source_port} -> "
            f"{self.dest_ip}:{self.dest_port} | "
            f"Size: {self.size}B | Seq: {self.sequence} | "
            f"Flags: {','.join(self.flags) if self.flags else 'None'}"
        )

    def __repr__(self) -> str:
        return f"Packet(id={self.id[:8]}, type={self.packet_type}, seq={self.sequence})"
