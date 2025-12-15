#!/usr/bin/env python3
"""
Packet Encapsulator - Handles layer-by-layer packet encapsulation.
Builds complete network packets from application data to Ethernet frame.
"""

from layers.ethernet import EthernetFrame
from layers.ip import IPv4Packet
from layers.tcp import TCPSegment
from layers.udp import UDPDatagram
from layers.icmp import ICMPMessage


class PacketBuilder:
    """
    High-level packet builder with encapsulation support.

    Encapsulation order:
    1. Application Data (payload)
    2. Transport Layer (TCP/UDP/ICMP)
    3. Network Layer (IPv4)
    4. Data Link Layer (Ethernet)
    """

    def __init__(self):
        self.layers = {}
        self.protocol = None

    def set_payload(self, data: bytes):
        """Set application layer data."""
        self.layers['payload'] = data
        return self

    def set_tcp(
        self,
        src_port: int = 12345,
        dst_port: int = 80,
        sequence: int = 0,
        acknowledgment: int = 0,
        flags: int = TCPSegment.FLAG_SYN,
        window: int = 65535
    ):
        """Configure TCP layer."""
        self.protocol = 'tcp'
        self.layers['tcp'] = {
            'src_port': src_port,
            'dst_port': dst_port,
            'sequence': sequence,
            'acknowledgment': acknowledgment,
            'flags': flags,
            'window': window
        }
        return self

    def set_udp(self, src_port: int = 12345, dst_port: int = 53):
        """Configure UDP layer."""
        self.protocol = 'udp'
        self.layers['udp'] = {
            'src_port': src_port,
            'dst_port': dst_port
        }
        return self

    def set_icmp(
        self,
        icmp_type: int = ICMPMessage.TYPE_ECHO_REQUEST,
        code: int = 0,
        identifier: int = 1,
        sequence: int = 1
    ):
        """Configure ICMP layer."""
        self.protocol = 'icmp'
        self.layers['icmp'] = {
            'icmp_type': icmp_type,
            'code': code,
            'identifier': identifier,
            'sequence': sequence
        }
        return self

    def set_ip(
        self,
        src_ip: str = "192.168.1.100",
        dst_ip: str = "192.168.1.1",
        ttl: int = 64,
        identification: int = 54321
    ):
        """Configure IP layer."""
        self.layers['ip'] = {
            'src_ip': src_ip,
            'dst_ip': dst_ip,
            'ttl': ttl,
            'identification': identification
        }
        return self

    def set_ethernet(
        self,
        src_mac: str = "00:11:22:33:44:55",
        dst_mac: str = "ff:ff:ff:ff:ff:ff"
    ):
        """Configure Ethernet layer."""
        self.layers['ethernet'] = {
            'src_mac': src_mac,
            'dst_mac': dst_mac
        }
        return self

    def build(self) -> bytes:
        """
        Build complete packet with encapsulation.

        Encapsulation process:
        1. Create transport layer (TCP/UDP/ICMP) with payload
        2. Encapsulate in IP packet
        3. Encapsulate in Ethernet frame
        4. Return raw bytes

        Returns:
            Complete packet as raw bytes
        """
        # Default values
        payload = self.layers.get('payload', b"Default payload data")
        ip_config = self.layers.get('ip', {})
        eth_config = self.layers.get('ethernet', {})

        src_ip = ip_config.get('src_ip', '192.168.1.100')
        dst_ip = ip_config.get('dst_ip', '192.168.1.1')
        ttl = ip_config.get('ttl', 64)
        identification = ip_config.get('identification', 54321)

        src_mac = eth_config.get('src_mac', '00:11:22:33:44:55')
        dst_mac = eth_config.get('dst_mac', 'ff:ff:ff:ff:ff:ff')

        # Step 1: Build transport layer
        if self.protocol == 'tcp':
            tcp_config = self.layers.get('tcp', {})
            transport = TCPSegment(
                src_port=tcp_config.get('src_port', 12345),
                dst_port=tcp_config.get('dst_port', 80),
                sequence=tcp_config.get('sequence', 0),
                acknowledgment=tcp_config.get('acknowledgment', 0),
                flags=tcp_config.get('flags', TCPSegment.FLAG_SYN),
                window=tcp_config.get('window', 65535),
                payload=payload,
                src_ip=src_ip,
                dst_ip=dst_ip
            )
            protocol_num = IPv4Packet.PROTOCOL_TCP

        elif self.protocol == 'udp':
            udp_config = self.layers.get('udp', {})
            transport = UDPDatagram(
                src_port=udp_config.get('src_port', 12345),
                dst_port=udp_config.get('dst_port', 53),
                payload=payload,
                src_ip=src_ip,
                dst_ip=dst_ip
            )
            protocol_num = IPv4Packet.PROTOCOL_UDP

        elif self.protocol == 'icmp':
            icmp_config = self.layers.get('icmp', {})
            transport = ICMPMessage(
                icmp_type=icmp_config.get('icmp_type', ICMPMessage.TYPE_ECHO_REQUEST),
                code=icmp_config.get('code', 0),
                identifier=icmp_config.get('identifier', 1),
                sequence=icmp_config.get('sequence', 1),
                payload=payload
            )
            protocol_num = IPv4Packet.PROTOCOL_ICMP

        else:
            raise ValueError(f"Unknown protocol: {self.protocol}")

        # Step 2: Encapsulate in IP packet
        transport_bytes = transport.to_bytes()

        ip_packet = IPv4Packet(
            src_ip=src_ip,
            dst_ip=dst_ip,
            protocol=protocol_num,
            ttl=ttl,
            identification=identification,
            payload=transport_bytes
        )

        # Step 3: Encapsulate in Ethernet frame
        ip_bytes = ip_packet.to_bytes()

        ethernet_frame = EthernetFrame(
            src_mac=src_mac,
            dst_mac=dst_mac,
            ethertype=EthernetFrame.ETHERTYPE_IPv4,
            payload=ip_bytes
        )

        # Step 4: Return complete packet
        return ethernet_frame.to_bytes()

    def get_layers(self) -> dict:
        """
        Get layer objects for visualization.

        Returns:
            Dictionary with layer objects
        """
        payload = self.layers.get('payload', b"Default payload data")
        ip_config = self.layers.get('ip', {})
        eth_config = self.layers.get('ethernet', {})

        src_ip = ip_config.get('src_ip', '192.168.1.100')
        dst_ip = ip_config.get('dst_ip', '192.168.1.1')

        # Build transport layer
        if self.protocol == 'tcp':
            tcp_config = self.layers.get('tcp', {})
            transport = TCPSegment(
                src_port=tcp_config.get('src_port', 12345),
                dst_port=tcp_config.get('dst_port', 80),
                sequence=tcp_config.get('sequence', 0),
                acknowledgment=tcp_config.get('acknowledgment', 0),
                flags=tcp_config.get('flags', TCPSegment.FLAG_SYN),
                window=tcp_config.get('window', 65535),
                payload=payload,
                src_ip=src_ip,
                dst_ip=dst_ip
            )
            protocol_num = IPv4Packet.PROTOCOL_TCP

        elif self.protocol == 'udp':
            udp_config = self.layers.get('udp', {})
            transport = UDPDatagram(
                src_port=udp_config.get('src_port', 12345),
                dst_port=udp_config.get('dst_port', 53),
                payload=payload,
                src_ip=src_ip,
                dst_ip=dst_ip
            )
            protocol_num = IPv4Packet.PROTOCOL_UDP

        elif self.protocol == 'icmp':
            icmp_config = self.layers.get('icmp', {})
            transport = ICMPMessage(
                icmp_type=icmp_config.get('icmp_type', ICMPMessage.TYPE_ECHO_REQUEST),
                code=icmp_config.get('code', 0),
                identifier=icmp_config.get('identifier', 1),
                sequence=icmp_config.get('sequence', 1),
                payload=payload
            )
            protocol_num = IPv4Packet.PROTOCOL_ICMP
        else:
            transport = None
            protocol_num = 0

        # Build IP packet
        transport_bytes = transport.to_bytes() if transport else b""
        ip_packet = IPv4Packet(
            src_ip=src_ip,
            dst_ip=dst_ip,
            protocol=protocol_num,
            ttl=ip_config.get('ttl', 64),
            identification=ip_config.get('identification', 54321),
            payload=transport_bytes
        )

        # Build Ethernet frame
        ip_bytes = ip_packet.to_bytes()
        ethernet_frame = EthernetFrame(
            src_mac=eth_config.get('src_mac', '00:11:22:33:44:55'),
            dst_mac=eth_config.get('dst_mac', 'ff:ff:ff:ff:ff:ff'),
            ethertype=EthernetFrame.ETHERTYPE_IPv4,
            payload=ip_bytes
        )

        return {
            'ethernet': ethernet_frame,
            'ip': ip_packet,
            'transport': transport,
            'payload': payload
        }
