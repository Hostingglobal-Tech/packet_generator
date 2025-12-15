#!/usr/bin/env python3
"""
Packet Builder CLI - Build custom network packets from scratch.

This tool allows you to construct network packets layer by layer:
- Ethernet (Layer 2)
- IPv4 (Layer 3)
- TCP/UDP/ICMP (Layer 4)
- Application Data

Usage:
    # TCP SYN packet
    python3 packet_builder.py --protocol tcp --tcp-flags SYN \\
        --ip-src 192.168.1.100 --ip-dst 192.168.1.1 \\
        --tcp-sport 12345 --tcp-dport 80 \\
        --payload "Hello" --visualize

    # UDP packet
    python3 packet_builder.py --protocol udp \\
        --ip-src 10.0.0.1 --ip-dst 10.0.0.2 \\
        --udp-sport 53 --udp-dport 53 \\
        --payload "DNS query" --hexdump

    # ICMP Echo Request
    python3 packet_builder.py --protocol icmp --icmp-type 8 \\
        --ip-src 192.168.1.1 --ip-dst 8.8.8.8 \\
        --visualize --pcap ping.pcap
"""

import argparse
import sys

from encapsulator import PacketBuilder
from visualizer import visualize_packet, visualize_layers_only, hexdump, save_pcap
from layers.tcp import TCPSegment
from layers.icmp import ICMPMessage
from common.utils import print_header, print_success, print_error


def parse_tcp_flags(flags_str: str) -> int:
    """Parse TCP flags from string."""
    flags = 0
    flag_map = {
        'FIN': TCPSegment.FLAG_FIN,
        'SYN': TCPSegment.FLAG_SYN,
        'RST': TCPSegment.FLAG_RST,
        'PSH': TCPSegment.FLAG_PSH,
        'ACK': TCPSegment.FLAG_ACK,
        'URG': TCPSegment.FLAG_URG,
        'ECE': TCPSegment.FLAG_ECE,
        'CWR': TCPSegment.FLAG_CWR,
        'NS': TCPSegment.FLAG_NS
    }

    for flag_name in flags_str.split(','):
        flag_name = flag_name.strip().upper()
        if flag_name in flag_map:
            flags |= flag_map[flag_name]
        else:
            print_error(f"Unknown TCP flag: {flag_name}")
            sys.exit(1)

    return flags


def main():
    parser = argparse.ArgumentParser(
        description="Build custom network packets layer by layer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  TCP SYN packet:
    python3 packet_builder.py --protocol tcp --tcp-flags SYN \\
        --ip-src 192.168.1.100 --ip-dst 192.168.1.1 \\
        --tcp-sport 12345 --tcp-dport 80 --visualize

  UDP DNS query:
    python3 packet_builder.py --protocol udp \\
        --udp-sport 53 --udp-dport 53 \\
        --payload "DNS" --hexdump

  ICMP ping:
    python3 packet_builder.py --protocol icmp --icmp-type 8 \\
        --ip-src 192.168.1.1 --ip-dst 8.8.8.8 \\
        --visualize --pcap ping.pcap

  Save to file:
    python3 packet_builder.py --protocol tcp --tcp-flags SYN \\
        --output packet.bin --pcap packet.pcap
        """
    )

    # Protocol
    parser.add_argument(
        '--protocol',
        choices=['tcp', 'udp', 'icmp'],
        required=True,
        help="Transport protocol"
    )

    # Ethernet Layer
    parser.add_argument('--eth-src', default="00:11:22:33:44:55", help="Source MAC address")
    parser.add_argument('--eth-dst', default="ff:ff:ff:ff:ff:ff", help="Destination MAC address")

    # IP Layer
    parser.add_argument('--ip-src', default="192.168.1.100", help="Source IP address")
    parser.add_argument('--ip-dst', default="192.168.1.1", help="Destination IP address")
    parser.add_argument('--ip-ttl', type=int, default=64, help="TTL value")
    parser.add_argument('--ip-id', type=int, default=54321, help="Identification field")

    # TCP Layer
    parser.add_argument('--tcp-sport', type=int, default=12345, help="TCP source port")
    parser.add_argument('--tcp-dport', type=int, default=80, help="TCP destination port")
    parser.add_argument('--tcp-seq', type=int, default=0, help="TCP sequence number")
    parser.add_argument('--tcp-ack', type=int, default=0, help="TCP acknowledgment number")
    parser.add_argument('--tcp-flags', default="SYN", help="TCP flags (comma-separated: SYN,ACK,FIN,etc)")
    parser.add_argument('--tcp-window', type=int, default=65535, help="TCP window size")

    # UDP Layer
    parser.add_argument('--udp-sport', type=int, default=12345, help="UDP source port")
    parser.add_argument('--udp-dport', type=int, default=53, help="UDP destination port")

    # ICMP Layer
    parser.add_argument('--icmp-type', type=int, default=8, help="ICMP type (8=Echo Request, 0=Echo Reply)")
    parser.add_argument('--icmp-code', type=int, default=0, help="ICMP code")
    parser.add_argument('--icmp-id', type=int, default=1, help="ICMP identifier")
    parser.add_argument('--icmp-seq', type=int, default=1, help="ICMP sequence number")

    # Payload
    parser.add_argument('--payload', default="Default payload data", help="Application data")

    # Output options
    parser.add_argument('--visualize', action='store_true', help="Show packet structure")
    parser.add_argument('--hexdump', action='store_true', help="Show hexdump only")
    parser.add_argument('--output', help="Save raw packet to binary file")
    parser.add_argument('--pcap', help="Save packet to pcap file")

    args = parser.parse_args()

    # Build packet
    try:
        print_header("PACKET BUILDER")

        builder = PacketBuilder()

        # Set payload
        payload_bytes = args.payload.encode('utf-8')
        builder.set_payload(payload_bytes)

        # Set Ethernet
        builder.set_ethernet(src_mac=args.eth_src, dst_mac=args.eth_dst)

        # Set IP
        builder.set_ip(
            src_ip=args.ip_src,
            dst_ip=args.ip_dst,
            ttl=args.ip_ttl,
            identification=args.ip_id
        )

        # Set Transport Layer
        if args.protocol == 'tcp':
            tcp_flags = parse_tcp_flags(args.tcp_flags)
            builder.set_tcp(
                src_port=args.tcp_sport,
                dst_port=args.tcp_dport,
                sequence=args.tcp_seq,
                acknowledgment=args.tcp_ack,
                flags=tcp_flags,
                window=args.tcp_window
            )
        elif args.protocol == 'udp':
            builder.set_udp(
                src_port=args.udp_sport,
                dst_port=args.udp_dport
            )
        elif args.protocol == 'icmp':
            builder.set_icmp(
                icmp_type=args.icmp_type,
                code=args.icmp_code,
                identifier=args.icmp_id,
                sequence=args.icmp_seq
            )

        # Build packet
        packet_bytes = builder.build()
        layers = builder.get_layers()

        print_success(f"Packet built successfully ({len(packet_bytes)} bytes)")

        # Visualize
        if args.visualize:
            print("\n" + visualize_packet(packet_bytes, layers))

        # Hexdump only
        elif args.hexdump:
            print("\n" + hexdump(packet_bytes))
            print(f"\nTotal size: {len(packet_bytes)} bytes")

        # Save to binary file
        if args.output:
            with open(args.output, 'wb') as f:
                f.write(packet_bytes)
            print_success(f"Packet saved to {args.output}")

        # Save to pcap file
        if args.pcap:
            save_pcap(packet_bytes, args.pcap)

        # Default: show layers
        if not args.visualize and not args.hexdump:
            print("\n" + visualize_layers_only(layers))

    except Exception as e:
        print_error(f"Failed to build packet: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
