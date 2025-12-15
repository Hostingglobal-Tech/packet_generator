#!/usr/bin/env python3
"""
IPv4 Layer (Layer 3) implementation.
Handles IPv4 packet creation, checksum calculation, and serialization.
"""

import struct
import socket


class IPv4Packet:
    """
    IPv4 Packet structure (RFC 791).

    Format (20 bytes minimum):
    - Version + IHL: 1 byte
    - TOS: 1 byte
    - Total Length: 2 bytes
    - Identification: 2 bytes
    - Flags + Fragment Offset: 2 bytes
    - TTL: 1 byte
    - Protocol: 1 byte (6=TCP, 17=UDP, 1=ICMP)
    - Header Checksum: 2 bytes
    - Source IP: 4 bytes
    - Destination IP: 4 bytes
    - Options: variable (rarely used)
    - Payload: variable
    """

    PROTOCOL_ICMP = 1
    PROTOCOL_TCP = 6
    PROTOCOL_UDP = 17

    def __init__(
        self,
        src_ip: str = "192.168.1.100",
        dst_ip: str = "192.168.1.1",
        protocol: int = PROTOCOL_TCP,
        ttl: int = 64,
        identification: int = 54321,
        flags: int = 0,
        fragment_offset: int = 0,
        tos: int = 0,
        payload: bytes = b""
    ):
        """
        Initialize IPv4 packet.

        Args:
            src_ip: Source IP address (e.g., "192.168.1.100")
            dst_ip: Destination IP address
            protocol: Protocol number (6=TCP, 17=UDP, 1=ICMP)
            ttl: Time to live
            identification: Packet identification
            flags: IP flags (0x2=Don't Fragment, 0x1=More Fragments)
            fragment_offset: Fragment offset
            tos: Type of Service
            payload: Upper layer data (TCP/UDP/ICMP)
        """
        self.version = 4  # IPv4
        self.ihl = 5  # Header length in 32-bit words (5 = 20 bytes)
        self.tos = tos
        self.identification = identification
        self.flags = flags
        self.fragment_offset = fragment_offset
        self.ttl = ttl
        self.protocol = protocol
        self.src_ip = self._parse_ip(src_ip)
        self.dst_ip = self._parse_ip(dst_ip)
        self.payload = payload
        self.checksum = 0  # Will be calculated in to_bytes()

    def _parse_ip(self, ip_str: str) -> bytes:
        """Convert IP address string to bytes."""
        return socket.inet_aton(ip_str)

    def _ip_to_str(self, ip_bytes: bytes) -> str:
        """Convert IP bytes to string."""
        return socket.inet_ntoa(ip_bytes)

    def _calculate_checksum(self, header: bytes) -> int:
        """
        Calculate IPv4 header checksum.

        The checksum is the 16-bit one's complement of the one's complement sum
        of all 16-bit words in the header.
        """
        # Ensure header length is even
        if len(header) % 2 == 1:
            header += b'\x00'

        # Sum all 16-bit words
        checksum = 0
        for i in range(0, len(header), 2):
            word = (header[i] << 8) + header[i + 1]
            checksum += word

        # Add carry bits
        while checksum >> 16:
            checksum = (checksum & 0xFFFF) + (checksum >> 16)

        # One's complement
        checksum = ~checksum & 0xFFFF

        return checksum

    def to_bytes(self) -> bytes:
        """
        Serialize packet to bytes with checksum calculation.

        Returns:
            Raw bytes of IPv4 packet
        """
        # Calculate total length
        total_length = self.ihl * 4 + len(self.payload)

        # Version and IHL (4 bits each)
        version_ihl = (self.version << 4) | self.ihl

        # Flags and Fragment Offset
        flags_offset = (self.flags << 13) | self.fragment_offset

        # Pack header (checksum = 0 for now)
        header = struct.pack(
            "!BBHHHBBH4s4s",
            version_ihl,           # Version + IHL
            self.tos,              # TOS
            total_length,          # Total Length
            self.identification,   # Identification
            flags_offset,          # Flags + Fragment Offset
            self.ttl,              # TTL
            self.protocol,         # Protocol
            0,                     # Checksum (placeholder)
            self.src_ip,           # Source IP
            self.dst_ip            # Destination IP
        )

        # Calculate checksum
        self.checksum = self._calculate_checksum(header)

        # Pack header again with correct checksum
        header = struct.pack(
            "!BBHHHBBH4s4s",
            version_ihl,
            self.tos,
            total_length,
            self.identification,
            flags_offset,
            self.ttl,
            self.protocol,
            self.checksum,
            self.src_ip,
            self.dst_ip
        )

        return header + self.payload

    @classmethod
    def from_bytes(cls, data: bytes) -> 'IPv4Packet':
        """Parse IPv4 packet from bytes."""
        if len(data) < 20:
            raise ValueError("Data too short for IPv4 packet")

        version_ihl, tos, total_length, identification, flags_offset, ttl, protocol, checksum, src_ip, dst_ip = struct.unpack(
            "!BBHHHBBH4s4s", data[:20]
        )

        version = version_ihl >> 4
        ihl = version_ihl & 0x0F
        flags = flags_offset >> 13
        fragment_offset = flags_offset & 0x1FFF

        header_len = ihl * 4
        payload = data[header_len:]

        packet = cls(
            src_ip=socket.inet_ntoa(src_ip),
            dst_ip=socket.inet_ntoa(dst_ip),
            protocol=protocol,
            ttl=ttl,
            identification=identification,
            flags=flags,
            fragment_offset=fragment_offset,
            tos=tos,
            payload=payload
        )

        packet.checksum = checksum
        return packet

    def __str__(self) -> str:
        """String representation."""
        protocol_names = {1: "ICMP", 6: "TCP", 17: "UDP"}
        protocol_str = protocol_names.get(self.protocol, str(self.protocol))

        return (
            f"IPv4 Packet:\n"
            f"  Version: {self.version} | IHL: {self.ihl} | TOS: 0x{self.tos:02x}\n"
            f"  Total Length: {self.ihl * 4 + len(self.payload)} bytes\n"
            f"  ID: 0x{self.identification:04x} | Flags: {self.flags} | Offset: {self.fragment_offset}\n"
            f"  TTL: {self.ttl} | Protocol: {protocol_str} ({self.protocol})\n"
            f"  Checksum: 0x{self.checksum:04x}\n"
            f"  Src IP: {self._ip_to_str(self.src_ip)}\n"
            f"  Dst IP: {self._ip_to_str(self.dst_ip)}\n"
            f"  Payload: {len(self.payload)} bytes"
        )

    def __len__(self) -> int:
        """Return total packet length."""
        return self.ihl * 4 + len(self.payload)
