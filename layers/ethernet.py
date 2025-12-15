#!/usr/bin/env python3
"""
Ethernet Layer (Layer 2) implementation.
Handles Ethernet frame creation and serialization.
"""

import struct
import binascii


class EthernetFrame:
    """
    Ethernet II Frame structure.

    Format:
    - Destination MAC: 6 bytes
    - Source MAC: 6 bytes
    - EtherType: 2 bytes (0x0800 for IPv4, 0x0806 for ARP)
    - Payload: variable
    - FCS: 4 bytes (Frame Check Sequence - CRC32)
    """

    ETHERTYPE_IPv4 = 0x0800
    ETHERTYPE_ARP = 0x0806
    ETHERTYPE_IPv6 = 0x86DD

    def __init__(
        self,
        dst_mac: str = "ff:ff:ff:ff:ff:ff",
        src_mac: str = "00:11:22:33:44:55",
        ethertype: int = ETHERTYPE_IPv4,
        payload: bytes = b""
    ):
        """
        Initialize Ethernet frame.

        Args:
            dst_mac: Destination MAC address (e.g., "aa:bb:cc:dd:ee:ff")
            src_mac: Source MAC address
            ethertype: EtherType field (0x0800 for IPv4)
            payload: Upper layer data
        """
        self.dst_mac = self._parse_mac(dst_mac)
        self.src_mac = self._parse_mac(src_mac)
        self.ethertype = ethertype
        self.payload = payload

    def _parse_mac(self, mac_str: str) -> bytes:
        """Convert MAC address string to bytes."""
        # Remove colons/dashes and convert to bytes
        mac_hex = mac_str.replace(":", "").replace("-", "")
        return bytes.fromhex(mac_hex)

    def _mac_to_str(self, mac_bytes: bytes) -> str:
        """Convert MAC bytes to string format."""
        return ":".join(f"{b:02x}" for b in mac_bytes)

    def to_bytes(self, include_fcs: bool = False) -> bytes:
        """
        Serialize frame to bytes.

        Args:
            include_fcs: Whether to include FCS (CRC32) at the end

        Returns:
            Raw bytes of Ethernet frame
        """
        # Pack: dst_mac(6) + src_mac(6) + ethertype(2)
        header = self.dst_mac + self.src_mac + struct.pack("!H", self.ethertype)
        frame = header + self.payload

        if include_fcs:
            # Calculate and append CRC32
            fcs = binascii.crc32(frame) & 0xFFFFFFFF
            frame += struct.pack("!I", fcs)

        return frame

    @classmethod
    def from_bytes(cls, data: bytes) -> 'EthernetFrame':
        """Parse Ethernet frame from bytes."""
        if len(data) < 14:
            raise ValueError("Data too short for Ethernet frame")

        dst_mac = data[0:6]
        src_mac = data[6:12]
        ethertype = struct.unpack("!H", data[12:14])[0]
        payload = data[14:]

        frame = cls(
            dst_mac=":".join(f"{b:02x}" for b in dst_mac),
            src_mac=":".join(f"{b:02x}" for b in src_mac),
            ethertype=ethertype,
            payload=payload
        )

        return frame

    def __str__(self) -> str:
        """String representation."""
        return (
            f"Ethernet Frame:\n"
            f"  Dst MAC: {self._mac_to_str(self.dst_mac)}\n"
            f"  Src MAC: {self._mac_to_str(self.src_mac)}\n"
            f"  EtherType: 0x{self.ethertype:04x}\n"
            f"  Payload: {len(self.payload)} bytes"
        )

    def __len__(self) -> int:
        """Return total frame length."""
        return 14 + len(self.payload)  # Header (14) + Payload
