#!/usr/bin/env python3
"""
ICMP Layer (Layer 4) implementation.
Handles ICMP message creation, checksum calculation, and serialization.
"""

import struct


class ICMPMessage:
    """
    ICMP Message structure (RFC 792).

    Format (8 bytes minimum):
    - Type: 1 byte
    - Code: 1 byte
    - Checksum: 2 bytes
    - Rest of Header: 4 bytes (varies by type)
    - Payload: variable
    """

    # Common ICMP Types
    TYPE_ECHO_REPLY = 0
    TYPE_DEST_UNREACHABLE = 3
    TYPE_REDIRECT = 5
    TYPE_ECHO_REQUEST = 8
    TYPE_TIME_EXCEEDED = 11

    def __init__(
        self,
        icmp_type: int = TYPE_ECHO_REQUEST,
        code: int = 0,
        identifier: int = 1,
        sequence: int = 1,
        payload: bytes = b"ICMP Test Data"
    ):
        """
        Initialize ICMP message.

        Args:
            icmp_type: ICMP type (8=Echo Request, 0=Echo Reply)
            code: ICMP code (usually 0)
            identifier: Identifier for Echo messages
            sequence: Sequence number for Echo messages
            payload: ICMP data
        """
        self.icmp_type = icmp_type
        self.code = code
        self.identifier = identifier
        self.sequence = sequence
        self.payload = payload
        self.checksum = 0

    def _calculate_checksum(self, data: bytes) -> int:
        """
        Calculate ICMP checksum.

        The checksum is the 16-bit one's complement of the one's complement sum
        of the ICMP message.
        """
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
        Serialize message to bytes with checksum calculation.

        Returns:
            Raw bytes of ICMP message
        """
        # Pack ICMP header (checksum = 0 for now)
        header = struct.pack(
            "!BBHHH",
            self.icmp_type,
            self.code,
            0,  # Checksum (placeholder)
            self.identifier,
            self.sequence
        )

        message = header + self.payload

        # Calculate checksum
        self.checksum = self._calculate_checksum(message)

        # Pack header again with correct checksum
        header = struct.pack(
            "!BBHHH",
            self.icmp_type,
            self.code,
            self.checksum,
            self.identifier,
            self.sequence
        )

        return header + self.payload

    @classmethod
    def from_bytes(cls, data: bytes) -> 'ICMPMessage':
        """Parse ICMP message from bytes."""
        if len(data) < 8:
            raise ValueError("Data too short for ICMP message")

        icmp_type, code, checksum, identifier, sequence = struct.unpack("!BBHHH", data[:8])

        payload = data[8:]

        message = cls(
            icmp_type=icmp_type,
            code=code,
            identifier=identifier,
            sequence=sequence,
            payload=payload
        )

        message.checksum = checksum
        return message

    def __str__(self) -> str:
        """String representation."""
        type_names = {
            0: "Echo Reply",
            3: "Destination Unreachable",
            5: "Redirect",
            8: "Echo Request",
            11: "Time Exceeded"
        }
        type_str = type_names.get(self.icmp_type, f"Type {self.icmp_type}")

        return (
            f"ICMP Message:\n"
            f"  Type: {type_str} ({self.icmp_type})\n"
            f"  Code: {self.code}\n"
            f"  Checksum: 0x{self.checksum:04x}\n"
            f"  Identifier: {self.identifier}\n"
            f"  Sequence: {self.sequence}\n"
            f"  Payload: {len(self.payload)} bytes"
        )

    def __len__(self) -> int:
        """Return total message length."""
        return 8 + len(self.payload)
