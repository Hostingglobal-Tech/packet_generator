#!/usr/bin/env python3
"""
TCP Layer (Layer 4) implementation.
Handles TCP segment creation, checksum calculation, and serialization.
"""

import struct
import socket


class TCPSegment:
    """
    TCP Segment structure (RFC 793).

    Format (20 bytes minimum):
    - Source Port: 2 bytes
    - Destination Port: 2 bytes
    - Sequence Number: 4 bytes
    - Acknowledgment Number: 4 bytes
    - Data Offset + Reserved + Flags: 2 bytes
    - Window Size: 2 bytes
    - Checksum: 2 bytes
    - Urgent Pointer: 2 bytes
    - Options: variable
    - Payload: variable
    """

    # TCP Flags
    FLAG_FIN = 0x01
    FLAG_SYN = 0x02
    FLAG_RST = 0x04
    FLAG_PSH = 0x08
    FLAG_ACK = 0x10
    FLAG_URG = 0x20
    FLAG_ECE = 0x40
    FLAG_CWR = 0x80
    FLAG_NS = 0x100

    def __init__(
        self,
        src_port: int = 12345,
        dst_port: int = 80,
        sequence: int = 0,
        acknowledgment: int = 0,
        flags: int = FLAG_SYN,
        window: int = 65535,
        urgent_pointer: int = 0,
        payload: bytes = b"",
        src_ip: str = "192.168.1.100",
        dst_ip: str = "192.168.1.1"
    ):
        """
        Initialize TCP segment.

        Args:
            src_port: Source port number
            dst_port: Destination port number
            sequence: Sequence number
            acknowledgment: Acknowledgment number
            flags: TCP flags (use FLAG_* constants)
            window: Window size
            urgent_pointer: Urgent pointer
            payload: Application data
            src_ip: Source IP (needed for checksum calculation)
            dst_ip: Destination IP (needed for checksum calculation)
        """
        self.src_port = src_port
        self.dst_port = dst_port
        self.sequence = sequence
        self.acknowledgment = acknowledgment
        self.flags = flags
        self.window = window
        self.urgent_pointer = urgent_pointer
        self.payload = payload
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.checksum = 0
        self.data_offset = 5  # Header length in 32-bit words (5 = 20 bytes)

    def _flags_to_str(self) -> str:
        """Convert flags to string representation."""
        flag_names = []
        if self.flags & self.FLAG_NS:
            flag_names.append("NS")
        if self.flags & self.FLAG_CWR:
            flag_names.append("CWR")
        if self.flags & self.FLAG_ECE:
            flag_names.append("ECE")
        if self.flags & self.FLAG_URG:
            flag_names.append("URG")
        if self.flags & self.FLAG_ACK:
            flag_names.append("ACK")
        if self.flags & self.FLAG_PSH:
            flag_names.append("PSH")
        if self.flags & self.FLAG_RST:
            flag_names.append("RST")
        if self.flags & self.FLAG_SYN:
            flag_names.append("SYN")
        if self.flags & self.FLAG_FIN:
            flag_names.append("FIN")
        return ",".join(flag_names) if flag_names else "None"

    def _calculate_checksum(self, pseudo_header: bytes, tcp_segment: bytes) -> int:
        """
        Calculate TCP checksum including pseudo header.

        The checksum includes:
        1. Pseudo header (12 bytes)
        2. TCP header
        3. TCP data

        Pseudo header format:
        - Source IP: 4 bytes
        - Destination IP: 4 bytes
        - Zero: 1 byte
        - Protocol: 1 byte (6 for TCP)
        - TCP Length: 2 bytes
        """
        # Combine pseudo header and segment
        data = pseudo_header + tcp_segment

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

        return checksum

    def to_bytes(self) -> bytes:
        """
        Serialize segment to bytes with checksum calculation.

        Returns:
            Raw bytes of TCP segment
        """
        # Data offset and flags
        offset_reserved_flags = (self.data_offset << 12) | self.flags

        # Pack TCP header (checksum = 0 for now)
        header = struct.pack(
            "!HHIIHHHH",
            self.src_port,
            self.dst_port,
            self.sequence,
            self.acknowledgment,
            offset_reserved_flags,
            self.window,
            0,  # Checksum (placeholder)
            self.urgent_pointer
        )

        segment = header + self.payload

        # Build pseudo header
        src_ip_bytes = socket.inet_aton(self.src_ip)
        dst_ip_bytes = socket.inet_aton(self.dst_ip)
        tcp_length = len(segment)

        pseudo_header = struct.pack(
            "!4s4sBBH",
            src_ip_bytes,
            dst_ip_bytes,
            0,  # Reserved
            6,  # Protocol (TCP)
            tcp_length
        )

        # Calculate checksum
        self.checksum = self._calculate_checksum(pseudo_header, segment)

        # Pack header again with correct checksum
        header = struct.pack(
            "!HHIIHHHH",
            self.src_port,
            self.dst_port,
            self.sequence,
            self.acknowledgment,
            offset_reserved_flags,
            self.window,
            self.checksum,
            self.urgent_pointer
        )

        return header + self.payload

    @classmethod
    def from_bytes(cls, data: bytes, src_ip: str, dst_ip: str) -> 'TCPSegment':
        """Parse TCP segment from bytes."""
        if len(data) < 20:
            raise ValueError("Data too short for TCP segment")

        src_port, dst_port, sequence, acknowledgment, offset_flags, window, checksum, urgent_pointer = struct.unpack(
            "!HHIIHHHH", data[:20]
        )

        data_offset = offset_flags >> 12
        flags = offset_flags & 0x1FF

        header_len = data_offset * 4
        payload = data[header_len:]

        segment = cls(
            src_port=src_port,
            dst_port=dst_port,
            sequence=sequence,
            acknowledgment=acknowledgment,
            flags=flags,
            window=window,
            urgent_pointer=urgent_pointer,
            payload=payload,
            src_ip=src_ip,
            dst_ip=dst_ip
        )

        segment.checksum = checksum
        return segment

    def __str__(self) -> str:
        """String representation."""
        return (
            f"TCP Segment:\n"
            f"  Src Port: {self.src_port} | Dst Port: {self.dst_port}\n"
            f"  Sequence: 0x{self.sequence:08x}\n"
            f"  Acknowledgment: 0x{self.acknowledgment:08x}\n"
            f"  Offset: {self.data_offset} | Flags: [{self._flags_to_str()}]\n"
            f"  Window: {self.window}\n"
            f"  Checksum: 0x{self.checksum:04x}\n"
            f"  Urgent Pointer: {self.urgent_pointer}\n"
            f"  Payload: {len(self.payload)} bytes"
        )

    def __len__(self) -> int:
        """Return total segment length."""
        return self.data_offset * 4 + len(self.payload)
