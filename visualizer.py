#!/usr/bin/env python3
"""
Packet Visualizer - Display packet structure and hexdump.
Provides human-readable visualization of network packets.
"""

from common.utils import Colors, colored


def hexdump(data: bytes, bytes_per_line: int = 16) -> str:
    """
    Generate hexdump of binary data.

    Args:
        data: Raw bytes to dump
        bytes_per_line: Number of bytes per line (default: 16)

    Returns:
        Formatted hexdump string
    """
    lines = []
    for i in range(0, len(data), bytes_per_line):
        chunk = data[i:i+bytes_per_line]

        # Offset
        offset = f"{i:04x}"

        # Hex bytes
        hex_part = " ".join(f"{b:02x}" for b in chunk)
        hex_part = hex_part.ljust(bytes_per_line * 3)

        # ASCII representation
        ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)

        lines.append(f"{offset}: {hex_part} | {ascii_part}")

    return "\n".join(lines)


def visualize_packet(packet_bytes: bytes, layers: dict) -> str:
    """
    Visualize complete packet with layer breakdown.

    Args:
        packet_bytes: Complete packet as raw bytes
        layers: Dictionary with layer objects

    Returns:
        Formatted visualization string
    """
    output = []
    output.append("=" * 70)
    output.append(colored("PACKET STRUCTURE", Colors.BOLD))
    output.append("=" * 70)

    # Ethernet Layer
    if 'ethernet' in layers:
        eth = layers['ethernet']
        output.append("")
        output.append(colored(f"[Ethernet Frame] {len(eth)} bytes", Colors.OKBLUE))
        output.append(f"  Dst MAC: {eth._mac_to_str(eth.dst_mac)}")
        output.append(f"  Src MAC: {eth._mac_to_str(eth.src_mac)}")
        output.append(f"  EtherType: 0x{eth.ethertype:04x} (IPv4)")

    # IP Layer
    if 'ip' in layers:
        ip = layers['ip']
        output.append("")
        output.append(colored(f"[IPv4 Packet] {ip.ihl * 4} bytes header", Colors.OKCYAN))
        output.append(f"  Version: {ip.version} | IHL: {ip.ihl} | TOS: 0x{ip.tos:02x}")
        output.append(f"  Total Length: {len(ip)} bytes")
        output.append(f"  ID: 0x{ip.identification:04x} | Flags: {ip.flags} | Offset: {ip.fragment_offset}")
        output.append(f"  TTL: {ip.ttl} | Protocol: {ip.protocol}")
        output.append(f"  Checksum: 0x{ip.checksum:04x}")
        output.append(f"  Src IP: {ip._ip_to_str(ip.src_ip)}")
        output.append(f"  Dst IP: {ip._ip_to_str(ip.dst_ip)}")

    # Transport Layer
    if 'transport' in layers:
        transport = layers['transport']
        output.append("")

        # TCP
        if hasattr(transport, 'src_port') and hasattr(transport, 'flags'):
            output.append(colored(f"[TCP Segment] {transport.data_offset * 4} bytes header", Colors.OKGREEN))
            output.append(f"  Src Port: {transport.src_port} | Dst Port: {transport.dst_port}")
            output.append(f"  Sequence: 0x{transport.sequence:08x}")
            output.append(f"  Acknowledgment: 0x{transport.acknowledgment:08x}")
            output.append(f"  Offset: {transport.data_offset} | Flags: [{transport._flags_to_str()}]")
            output.append(f"  Window: {transport.window}")
            output.append(f"  Checksum: 0x{transport.checksum:04x}")

        # UDP
        elif hasattr(transport, 'src_port') and not hasattr(transport, 'flags'):
            output.append(colored(f"[UDP Datagram] 8 bytes header", Colors.WARNING))
            output.append(f"  Src Port: {transport.src_port} | Dst Port: {transport.dst_port}")
            output.append(f"  Length: {len(transport)} bytes")
            output.append(f"  Checksum: 0x{transport.checksum:04x}")

        # ICMP
        elif hasattr(transport, 'icmp_type'):
            output.append(colored(f"[ICMP Message] 8 bytes header", Colors.WARNING))
            type_names = {0: "Echo Reply", 3: "Dest Unreachable", 5: "Redirect",
                         8: "Echo Request", 11: "Time Exceeded"}
            type_str = type_names.get(transport.icmp_type, f"Type {transport.icmp_type}")
            output.append(f"  Type: {type_str} ({transport.icmp_type})")
            output.append(f"  Code: {transport.code}")
            output.append(f"  Checksum: 0x{transport.checksum:04x}")
            output.append(f"  Identifier: {transport.identifier}")
            output.append(f"  Sequence: {transport.sequence}")

    # Payload
    if 'payload' in layers:
        payload = layers['payload']
        output.append("")
        output.append(colored(f"[Payload] {len(payload)} bytes", Colors.HEADER))
        if payload:
            # Try to decode as text
            try:
                text = payload.decode('utf-8', errors='ignore')
                preview = text[:100] + "..." if len(text) > 100 else text
                output.append(f'  "{preview}"')
            except:
                output.append(f"  (binary data)")

    # Hexdump
    output.append("")
    output.append("=" * 70)
    output.append(colored("HEX DUMP", Colors.BOLD))
    output.append("=" * 70)
    output.append(hexdump(packet_bytes))
    output.append("")
    output.append(colored(f"Total packet size: {len(packet_bytes)} bytes", Colors.OKGREEN))
    output.append("=" * 70)

    return "\n".join(output)


def visualize_layers_only(layers: dict) -> str:
    """
    Visualize only layer information without hexdump.

    Args:
        layers: Dictionary with layer objects

    Returns:
        Formatted layer info string
    """
    output = []

    # Ethernet
    if 'ethernet' in layers:
        output.append(str(layers['ethernet']))
        output.append("")

    # IP
    if 'ip' in layers:
        output.append(str(layers['ip']))
        output.append("")

    # Transport
    if 'transport' in layers:
        output.append(str(layers['transport']))
        output.append("")

    # Payload
    if 'payload' in layers:
        payload = layers['payload']
        output.append(f"Payload: {len(payload)} bytes")
        if payload:
            try:
                text = payload.decode('utf-8', errors='ignore')
                preview = text[:50] + "..." if len(text) > 50 else text
                output.append(f'  "{preview}"')
            except:
                output.append("  (binary data)")

    return "\n".join(output)


def save_pcap(packet_bytes: bytes, filename: str):
    """
    Save packet to pcap file format.

    Args:
        packet_bytes: Complete packet as raw bytes
        filename: Output filename (e.g., "packet.pcap")
    """
    import struct
    import time

    # PCAP Global Header
    pcap_global_header = struct.pack(
        "!IHHiIII",
        0xa1b2c3d4,  # Magic number
        2,           # Major version
        4,           # Minor version
        0,           # GMT to local correction
        0,           # Timestamp accuracy
        65535,       # Max packet length
        1            # Data link type (Ethernet)
    )

    # PCAP Packet Header
    ts = time.time()
    ts_sec = int(ts)
    ts_usec = int((ts - ts_sec) * 1000000)
    packet_len = len(packet_bytes)

    pcap_packet_header = struct.pack(
        "!IIII",
        ts_sec,      # Timestamp seconds
        ts_usec,     # Timestamp microseconds
        packet_len,  # Captured length
        packet_len   # Original length
    )

    # Write to file
    with open(filename, 'wb') as f:
        f.write(pcap_global_header)
        f.write(pcap_packet_header)
        f.write(packet_bytes)

    print(f"Packet saved to {filename}")
    print(f"You can open it with: wireshark {filename}")
