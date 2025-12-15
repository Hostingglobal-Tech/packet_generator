#!/usr/bin/env python3
"""
Packet Generator - Client
Generates and sends packets to the server.

Usage:
    python3 client.py [OPTIONS]

Example:
    # Send single TCP packet
    python3 client.py --type TCP

    # Send 100 UDP packets with 0.1s interval
    python3 client.py --type UDP --count 100 --interval 0.1

    # Send continuous ICMP packets
    python3 client.py --type ICMP --continuous

    # Send random packets
    python3 client.py --random --count 50
"""

import socket
import argparse
import time
import random
import sys
import signal
from typing import Optional

from common.packet import Packet, PacketType
from common.utils import (
    print_header, print_info, print_success, print_error, print_warning,
    Colors, colored, Statistics, progress_bar, get_timestamp
)


class PacketClient:
    """Client for generating and sending packets"""

    def __init__(self, server_host: str, server_port: int):
        self.server_host = server_host
        self.server_port = server_port
        self.socket = None
        self.connected = False
        self.running = False
        self.stats = Statistics()
        self.sequence = 0

        # Setup signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print("\n")
        print_warning("Shutdown signal received. Stopping client...")
        self.stop()

    def connect(self) -> bool:
        """Connect to the server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.server_host, self.server_port))
            self.connected = True
            print_success(f"Connected to server {self.server_host}:{self.server_port}")
            return True
        except ConnectionRefusedError:
            print_error(f"Connection refused. Is the server running at {self.server_host}:{self.server_port}?")
            return False
        except Exception as e:
            print_error(f"Failed to connect: {e}")
            return False

    def disconnect(self):
        """Disconnect from server"""
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
        self.connected = False

    def generate_packet(
        self,
        packet_type: str,
        source_ip: Optional[str] = None,
        dest_ip: Optional[str] = None,
        size: int = 64,
        payload: str = ""
    ) -> Packet:
        """Generate a packet with given parameters"""

        # Use defaults if not provided
        if not source_ip:
            source_ip = "192.168.1.100"
        if not dest_ip:
            dest_ip = self.server_host

        source_port = random.randint(10000, 65535)
        dest_port = self.server_port

        # Generate flags based on packet type
        flags = []
        if packet_type == PacketType.TCP:
            flags = random.sample(["SYN", "ACK", "FIN", "PSH", "RST"], k=random.randint(1, 3))
        elif packet_type == PacketType.HTTP:
            flags = ["GET", "200"]

        # Generate payload if not provided
        if not payload:
            if packet_type == PacketType.HTTP:
                payload = "GET /index.html HTTP/1.1"
            elif packet_type == PacketType.ICMP:
                payload = "Echo Request"
            else:
                payload = f"Data packet {self.sequence}"

        self.sequence += 1

        return Packet(
            packet_type=packet_type,
            source_ip=source_ip,
            source_port=source_port,
            dest_ip=dest_ip,
            dest_port=dest_port,
            size=size,
            payload=payload,
            flags=flags,
            sequence=self.sequence
        )

    def send_packet(self, packet: Packet) -> bool:
        """Send a packet to the server"""
        if not self.connected:
            print_error("Not connected to server")
            return False

        try:
            # Serialize packet
            data = packet.to_json().encode('utf-8')

            # Send length prefix (4 bytes)
            length = len(data)
            self.socket.sendall(length.to_bytes(4, byteorder='big'))

            # Send actual data
            self.socket.sendall(data)

            self.stats.add_packet(packet.size)
            return True

        except BrokenPipeError:
            print_error("Connection lost (broken pipe)")
            self.connected = False
            return False
        except Exception as e:
            print_error(f"Failed to send packet: {e}")
            return False

    def send_single(self, packet_type: str, size: int = 64):
        """Send a single packet"""
        print_header("SENDING SINGLE PACKET")

        packet = self.generate_packet(packet_type, size=size)
        print_info(f"Generated: {packet}")

        if self.send_packet(packet):
            print_success("Packet sent successfully")
        else:
            print_error("Failed to send packet")

    def send_batch(
        self,
        packet_type: str,
        count: int,
        interval: float = 0.0,
        size: int = 64,
        show_progress: bool = True
    ):
        """Send multiple packets"""
        print_header(f"SENDING BATCH: {count} PACKETS")
        print_info(f"Type: {packet_type} | Size: {size}B | Interval: {interval}s")

        self.running = True
        success_count = 0
        failed_count = 0

        start_time = time.time()

        for i in range(count):
            if not self.running:
                break

            # Generate and send packet
            packet = self.generate_packet(packet_type, size=size)

            if self.send_packet(packet):
                success_count += 1

                # Display progress
                if show_progress:
                    if count <= 20 or (i + 1) % (count // 20) == 0 or (i + 1) == count:
                        progress = progress_bar(i + 1, count, width=40)
                        rate = self.stats.get_rate()
                        print(f"\r{progress} | Sent: {i+1} | Rate: {rate:.1f} pkt/s", end='', flush=True)
            else:
                failed_count += 1
                break

            # Wait for interval
            if interval > 0 and i < count - 1:
                time.sleep(interval)

        elapsed = time.time() - start_time
        print()  # New line after progress

        # Print summary
        print("\n" + "=" * 70)
        print_header("BATCH COMPLETE")
        print_success(f"Sent: {success_count} packets")
        if failed_count > 0:
            print_error(f"Failed: {failed_count} packets")
        print_info(f"Duration: {elapsed:.2f}s | Rate: {success_count/elapsed:.2f} pkt/s")
        print("=" * 70)

    def send_continuous(self, packet_type: str, interval: float = 1.0, size: int = 64):
        """Send packets continuously until interrupted"""
        print_header("SENDING CONTINUOUS PACKETS")
        print_info(f"Type: {packet_type} | Size: {size}B | Interval: {interval}s")
        print_info("Press Ctrl+C to stop\n")

        self.running = True
        count = 0

        try:
            while self.running:
                packet = self.generate_packet(packet_type, size=size)

                if self.send_packet(packet):
                    count += 1

                    # Print status every 10 packets
                    if count % 10 == 0:
                        rate = self.stats.get_rate()
                        print_info(f"Sent: {count} packets | Rate: {rate:.2f} pkt/s | {self.stats.get_summary()}")

                    time.sleep(interval)
                else:
                    break

        except KeyboardInterrupt:
            pass

        print("\n" + "=" * 70)
        print_header("CONTINUOUS SENDING STOPPED")
        print_info(f"Total packets sent: {count}")
        print_info(self.stats.get_summary())
        print("=" * 70)

    def send_random(self, count: int, interval: float = 0.1):
        """Send random packets of different types"""
        print_header(f"SENDING RANDOM PACKETS: {count}")

        self.running = True
        types_count = {t: 0 for t in PacketType.all()}

        for i in range(count):
            if not self.running:
                break

            # Random packet type and size
            packet_type = random.choice(PacketType.all())
            size = random.randint(64, 1500)

            packet = self.generate_packet(packet_type, size=size)

            if self.send_packet(packet):
                types_count[packet_type] += 1

                # Show progress
                if (i + 1) % 10 == 0 or (i + 1) == count:
                    progress = progress_bar(i + 1, count, width=40)
                    print(f"\r{progress}", end='', flush=True)

                time.sleep(interval)
            else:
                break

        print()  # New line

        # Print summary
        print("\n" + "=" * 70)
        print_header("RANDOM SENDING COMPLETE")
        print_info("Packet type distribution:")
        for ptype, pcount in types_count.items():
            print(f"  {ptype:6}: {pcount:4} packets")
        print_info(self.stats.get_summary())
        print("=" * 70)

    def stop(self):
        """Stop the client"""
        self.running = False
        self.disconnect()
        print_info("Client stopped")
        sys.exit(0)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Packet Generator Client - Generate and send packets",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Send single TCP packet:
    python3 client.py --type TCP

  Send 100 UDP packets:
    python3 client.py --type UDP --count 100

  Send ICMP packets with interval:
    python3 client.py --type ICMP --count 50 --interval 0.5

  Send continuous HTTP packets:
    python3 client.py --type HTTP --continuous --interval 1

  Send random packets:
    python3 client.py --random --count 200

  Connect to remote server:
    python3 client.py --server 192.168.1.100 --port 8888 --type TCP
        """
    )

    parser.add_argument(
        "--server",
        default="localhost",
        help="Server address (default: localhost)"
    )

    parser.add_argument(
        "--port",
        type=int,
        default=5555,
        help="Server port (default: 5555)"
    )

    parser.add_argument(
        "--type",
        choices=PacketType.all(),
        help="Packet type (TCP/UDP/ICMP/HTTP)"
    )

    parser.add_argument(
        "--count",
        type=int,
        default=1,
        help="Number of packets to send (default: 1)"
    )

    parser.add_argument(
        "--interval",
        type=float,
        default=0.0,
        help="Interval between packets in seconds (default: 0)"
    )

    parser.add_argument(
        "--size",
        type=int,
        default=64,
        help="Packet size in bytes (default: 64)"
    )

    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Send packets continuously (use with --interval)"
    )

    parser.add_argument(
        "--random",
        action="store_true",
        help="Send random packet types"
    )

    args = parser.parse_args()

    # Validate arguments
    if not args.random and not args.type:
        parser.error("Either --type or --random must be specified")

    # Create client
    client = PacketClient(args.server, args.port)

    # Connect to server
    if not client.connect():
        sys.exit(1)

    try:
        # Send packets based on mode
        if args.random:
            client.send_random(args.count, args.interval)
        elif args.continuous:
            client.send_continuous(args.type, args.interval, args.size)
        elif args.count == 1:
            client.send_single(args.type, args.size)
        else:
            client.send_batch(args.type, args.count, args.interval, args.size)

    finally:
        client.disconnect()


if __name__ == "__main__":
    main()
