#!/usr/bin/env python3
"""
Packet Generator - Server
Receives and displays packets from clients in real-time.

Usage:
    python3 server.py [--host HOST] [--port PORT] [--log-file FILE]

Example:
    python3 server.py --host 0.0.0.0 --port 5555 --log-file packets.log
"""

import socket
import threading
import signal
import sys
import argparse
from typing import Optional

from common.packet import Packet
from common.utils import (
    print_header, print_info, print_success, print_error, print_warning,
    Colors, colored, Statistics, Logger, get_timestamp
)


class PacketServer:
    """Multi-threaded TCP server for receiving packets"""

    def __init__(
        self,
        host: str = "0.0.0.0",
        port: int = 5555,
        log_file: Optional[str] = None
    ):
        self.host = host
        self.port = port
        self.server_socket = None
        self.running = False
        self.clients = []
        self.stats = Statistics()
        self.logger = Logger(log_file)

        # Setup signal handler for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print("\n")
        print_warning("Shutdown signal received. Stopping server...")
        self.stop()

    def start(self):
        """Start the server"""
        try:
            # Create TCP socket
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)

            self.running = True

            print_header("PACKET GENERATOR SERVER")
            print_success(f"Server started on {self.host}:{self.port}")
            if self.logger.enabled:
                print_info(f"Logging to file: {self.logger.log_file}")
            print_info("Waiting for clients... (Press Ctrl+C to stop)\n")

            self.logger.log_info(f"Server started on {self.host}:{self.port}")

            # Accept client connections
            while self.running:
                try:
                    self.server_socket.settimeout(1.0)
                    client_socket, client_address = self.server_socket.accept()

                    print_success(f"Client connected: {client_address[0]}:{client_address[1]}")
                    self.logger.log_info(f"Client connected: {client_address}")

                    # Handle client in separate thread
                    client_thread = threading.Thread(
                        target=self.handle_client,
                        args=(client_socket, client_address),
                        daemon=True
                    )
                    client_thread.start()
                    self.clients.append((client_socket, client_thread))

                except socket.timeout:
                    continue
                except Exception as e:
                    if self.running:
                        print_error(f"Error accepting connection: {e}")

        except OSError as e:
            print_error(f"Failed to start server: {e}")
            print_error(f"Port {self.port} may already be in use.")
            sys.exit(1)
        except Exception as e:
            print_error(f"Unexpected error: {e}")
            sys.exit(1)

    def handle_client(self, client_socket: socket.socket, client_address: tuple):
        """Handle individual client connection"""
        client_id = f"{client_address[0]}:{client_address[1]}"

        try:
            while self.running:
                # Receive data (with length prefix)
                length_data = self.recv_exact(client_socket, 4)
                if not length_data:
                    break

                # Get message length
                msg_length = int.from_bytes(length_data, byteorder='big')

                # Receive actual message
                data = self.recv_exact(client_socket, msg_length)
                if not data:
                    break

                # Parse packet
                try:
                    packet = Packet.from_json(data.decode('utf-8'))
                    self.display_packet(packet, client_id)
                    self.stats.add_packet(packet.size)
                    self.logger.log_packet(str(packet))

                except Exception as e:
                    print_error(f"Failed to parse packet from {client_id}: {e}")
                    self.logger.log_error(f"Parse error from {client_id}: {e}")

        except ConnectionResetError:
            print_warning(f"Client {client_id} disconnected abruptly")
        except Exception as e:
            print_error(f"Error handling client {client_id}: {e}")
            self.logger.log_error(f"Client handler error {client_id}: {e}")
        finally:
            client_socket.close()
            print_info(f"Client {client_id} disconnected")
            self.logger.log_info(f"Client {client_id} disconnected")

    def recv_exact(self, sock: socket.socket, num_bytes: int) -> bytes:
        """Receive exact number of bytes from socket"""
        data = b''
        while len(data) < num_bytes:
            chunk = sock.recv(num_bytes - len(data))
            if not chunk:
                return None
            data += chunk
        return data

    def display_packet(self, packet: Packet, client_id: str):
        """Display packet information with colors"""
        # Get color based on packet type
        type_colors = {
            "TCP": Colors.TCP,
            "UDP": Colors.UDP,
            "ICMP": Colors.ICMP,
            "HTTP": Colors.HTTP
        }
        color = type_colors.get(packet.packet_type, Colors.OKBLUE)

        # Format packet info
        timestamp = get_timestamp()
        type_str = colored(f"[{packet.packet_type:4}]", color)
        client_str = colored(f"[{client_id}]", Colors.OKCYAN)
        route_str = f"{packet.source_ip}:{packet.source_port} -> {packet.dest_ip}:{packet.dest_port}"
        size_str = colored(f"{packet.size}B", Colors.WARNING)
        seq_str = colored(f"#{packet.sequence}", Colors.OKGREEN)

        # Build display string
        display = f"{timestamp} {type_str} {client_str} {route_str} | Size: {size_str} | Seq: {seq_str}"

        if packet.flags:
            flags_str = colored(f"[{','.join(packet.flags)}]", Colors.WARNING)
            display += f" | Flags: {flags_str}"

        if packet.payload and len(packet.payload) > 0:
            payload_preview = packet.payload[:50] + "..." if len(packet.payload) > 50 else packet.payload
            display += f" | Payload: {payload_preview}"

        print(display)

        # Print statistics periodically (every 100 packets)
        if self.stats.total_count % 100 == 0:
            print_info(f"Stats: {self.stats.get_summary()}")

    def stop(self):
        """Stop the server gracefully"""
        self.running = False

        # Close all client connections
        for client_socket, _ in self.clients:
            try:
                client_socket.close()
            except:
                pass

        # Close server socket
        if self.server_socket:
            try:
                self.server_socket.close()
            except:
                pass

        # Print final statistics
        print("\n" + "=" * 70)
        print_header("SERVER STOPPED - FINAL STATISTICS")
        print_info(self.stats.get_summary())
        print("=" * 70 + "\n")

        self.logger.log_info("Server stopped")
        self.logger.log_info(f"Final stats: {self.stats.get_summary()}")

        sys.exit(0)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Packet Generator Server - Receives and displays packets",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Start server on default port:
    python3 server.py

  Start server on specific port:
    python3 server.py --port 8888

  Start server with logging:
    python3 server.py --port 5555 --log-file packets.log

  Listen on all interfaces:
    python3 server.py --host 0.0.0.0 --port 5555
        """
    )

    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host address to bind to (default: 0.0.0.0)"
    )

    parser.add_argument(
        "--port",
        type=int,
        default=5555,
        help="Port number to listen on (default: 5555)"
    )

    parser.add_argument(
        "--log-file",
        help="Log file path for packet logging (optional)"
    )

    args = parser.parse_args()

    # Create and start server
    server = PacketServer(
        host=args.host,
        port=args.port,
        log_file=args.log_file
    )

    server.start()


if __name__ == "__main__":
    main()
