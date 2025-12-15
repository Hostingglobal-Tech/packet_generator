#!/usr/bin/env python3
"""
UDP Layer (Layer 4) implementation.
Handles UDP datagram creation, checksum calculation, and serialization.
"""

import struct
import socket


class UDPDatagram:
    """
    UDP Datagram structure (RFC 768).

    Format (8 bytes header):
    - Source Port: 2 bytes
    - Destination Port: 2 bytes
    - Length: 2 bytes (header + data)
    - Checksum: 2 bytes
    - Payload: variable
    """

    def __init__(
        self,
        src_port: int = 12345,
        dst_port: int = 53,
        payload: bytes = b"",
        src_ip: str = "192.168.1.100",
        dst_ip: str = "192.168.1.1"
    ):
        """
        Initialize UDP datagram.

        Args:
            src_port: Source port number
            dst_port: Destination port number
            payload: Application data
            src_ip: Source IP (needed for checksum calculation)
            dst_ip: Destination IP (needed for checksum calculation)
        """
        self.src_port = src_port
        self.dst_port = dst_port
        self.payload = payload
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.checksum = 0

    def _calculate_checksum(self, pseudo_header: bytes, udp_datagram: bytes) -> int:
        """
        Calculate UDP checksum including pseudo header.

        Pseudo header format:
        - Source IP: 4 bytes
        - Destination IP: 4 bytes
        - Zero: 1 byte
        - Protocol: 1 byte (17 for UDP)
        - UDP Length: 2 bytes
        """
        # Combine pseudo header and datagram
        data = pseudo_header + udp_datagram

        # Ensure data length is even
        if len(data) % 2 == 1:
            data += b'\x00'

        # Sum all 16-bit words
        checksum = 0
        for i in range(0, len(data), 2):
            word = (data[i] << 8) + data[i + 1]
            checksum += word

        # Add carry bits
        while checksum >> 16:
            checksum = (checksum & 0xFFFF) + (checksum >> 16)

        # One's complement
        checksum = ~checksum & 0xFFFF

        # UDP checksum 0x0000 is transmitted as 0xFFFF
        if checksum == 0:
            checksum = 0xFFFF

        return checksum

    def to_bytes(self) -> bytes:
        """
        Serialize datagram to bytes with checksum calculation.

        Returns:
            Raw bytes of UDP datagram
        """
        length = 8 + len(self.payload)

        # Pack UDP header (checksum = 0 for now)
        header = struct.pack(
            "!HHHH",
            self.src_port,
            self.dst_port,
            length,
            0  # Checksum (placeholder)
        )

        datagram = header + self.payload

        # Build pseudo header
        src_ip_bytes = socket.inet_aton(self.src_ip)
        dst_ip_bytes = socket.inet_aton(self.dst_ip)

        pseudo_header = struct.pack(
            "!4s4sBBH",
            src_ip_bytes,
            dst_ip_bytes,
            0,  # Reserved
            17,  # Protocol (UDP)
            length
        )

        # Calculate checksum
        self.checksum = self._calculate_checksum(pseudo_header, datagram)

        # Pack header again with correct checksum
        header = struct.pack(
            "!HHHH",
            self.src_port,
            self.dst_port,
            length,
            self.checksum
        )

        return header + self.payload

    @classmethod
    def from_bytes(cls, data: bytes, src_ip: str, dst_ip: str) -> 'UDPDatagram':
        """Parse UDP datagram from bytes."""
        if len(data) < 8:
            raise ValueError("Data too short for UDP datagram")

        src_port, dst_port, length, checksum = struct.unpack("!HHHH", data[:8])

        payload = data[8:]

        datagram = cls(
            src_port=src_port,
            dst_port=dst_port,
            payload=payload,
            src_ip=src_ip,
            dst_ip=dst_ip
        )

        datagram.checksum = checksum
        return datagram

    def __str__(self) -> str:
        """String representation."""
        return (
            f"UDP Datagram:\n"
            f"  Src Port: {self.src_port} | Dst Port: {self.dst_port}\n"
            f"  Length: {8 + len(self.payload)} bytes\n"
            f"  Checksum: 0x{self.checksum:04x}\n"
            f"  Payload: {len(self.payload)} bytes"
        )

    def __len__(self) -> int:
        """Return total datagram length."""
        return 8 + len(self.payload)
