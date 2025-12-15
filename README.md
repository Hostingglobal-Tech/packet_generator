# Packet Generator

A Linux CLI-based network packet generation and analysis tool. Build RFC-compliant network packets layer by layer, visualize them, and export to PCAP format for Wireshark analysis.

> **한국어 문서**: [README_KO.md](README_KO.md) 참조

## 🌟 Features

### 1. Layer-by-Layer Packet Construction (OSI Model)
- **Layer 2 (Ethernet)**: MAC addresses, EtherType, FCS
- **Layer 3 (IPv4)**: IP headers with checksum calculation
- **Layer 4**:
  - **TCP**: SYN/ACK/FIN flags, sequence numbers, pseudo-header checksum
  - **UDP**: Simple datagram transmission
  - **ICMP**: Echo Request/Reply (ping)

### 2. Packet Encapsulation
```
Application Payload → TCP/UDP/ICMP → IPv4 → Ethernet
```

### 3. Visualization Tools
- **Hexdump**: Hex dump with ASCII representation
- **Layer Analysis**: Detailed protocol field display
- **PCAP Export**: Wireshark-compatible file generation

## 📦 Installation

```bash
git clone https://github.com/yourusername/packet_generator.git
cd packet_generator
```

No dependencies required. Uses only Python 3.6+ standard library.

## 🚀 Quick Start

### Generate TCP SYN Packet
```bash
python3 packet_builder.py --protocol tcp --tcp-flags SYN --visualize
```

### Generate UDP DNS Query
```bash
python3 packet_builder.py --protocol udp \
    --udp-sport 53 --udp-dport 53 \
    --payload "DNS Query" --visualize
```

### Generate ICMP Ping
```bash
python3 packet_builder.py --protocol icmp \
    --icmp-type 8 --ip-dst 8.8.8.8 \
    --visualize --pcap ping.pcap
```

### Generate TCP SYN+ACK (Save to PCAP)
```bash
python3 packet_builder.py --protocol tcp \
    --tcp-flags "SYN,ACK" \
    --tcp-seq 1000 --tcp-ack 500 \
    --pcap output.pcap
```

## 📋 CLI Options

### Protocol
- `--protocol {tcp,udp,icmp}` - Select transport layer protocol

### Ethernet Layer
- `--eth-src MAC` - Source MAC address (default: 00:11:22:33:44:55)
- `--eth-dst MAC` - Destination MAC address (default: ff:ff:ff:ff:ff:ff)

### IP Layer
- `--ip-src IP` - Source IP address (default: 192.168.1.100)
- `--ip-dst IP` - Destination IP address (default: 192.168.1.1)
- `--ip-ttl N` - TTL value (default: 64)
- `--ip-id N` - Identification field (default: 54321)

### TCP Options
- `--tcp-sport PORT` - Source port (default: 12345)
- `--tcp-dport PORT` - Destination port (default: 80)
- `--tcp-seq N` - Sequence number (default: 0)
- `--tcp-ack N` - Acknowledgment number (default: 0)
- `--tcp-flags FLAGS` - TCP flags (e.g., "SYN", "SYN,ACK", "PSH,ACK")
- `--tcp-window N` - Window size (default: 65535)

### UDP Options
- `--udp-sport PORT` - Source port (default: 12345)
- `--udp-dport PORT` - Destination port (default: 53)

### ICMP Options
- `--icmp-type TYPE` - ICMP type (8=Echo Request, 0=Echo Reply)
- `--icmp-code CODE` - ICMP code (default: 0)
- `--icmp-id N` - Identifier (default: 1)
- `--icmp-seq N` - Sequence number (default: 1)

### Payload and Output
- `--payload TEXT` - Application data
- `--visualize` - Display detailed packet structure
- `--hexdump` - Display hexdump only
- `--output FILE` - Save raw binary to file
- `--pcap FILE` - Save to PCAP file (Wireshark compatible)

## 📊 Output Example

### TCP SYN Packet Visualization

```
======================================================================
                            PACKET STRUCTURE
======================================================================

[Ethernet Frame] 74 bytes
  Dst MAC: ff:ff:ff:ff:ff:ff
  Src MAC: 00:11:22:33:44:55
  EtherType: 0x0800 (IPv4)

[IPv4 Packet] 20 bytes header
  Version: 4 | IHL: 5 | TOS: 0x00
  Total Length: 60 bytes
  ID: 0xd431 | Flags: 0 | Offset: 0
  TTL: 64 | Protocol: 6
  Checksum: 0x22d5
  Src IP: 192.168.1.100
  Dst IP: 192.168.1.1

[TCP Segment] 20 bytes header
  Src Port: 12345 | Dst Port: 80
  Sequence: 0x00000000
  Acknowledgment: 0x00000000
  Offset: 5 | Flags: [SYN]
  Window: 65535
  Checksum: 0xd129

[Payload] 20 bytes
  "Default payload data"

======================================================================
                              HEX DUMP
======================================================================
0000: ff ff ff ff ff ff 00 11 22 33 44 55 08 00 45 00  | ........"3DU..E.
0010: 00 3c d4 31 00 00 40 06 22 d5 c0 a8 01 64 c0 a8  | .<.1..@."....d..
0020: 01 01 30 39 00 50 00 00 00 00 00 00 00 00 50 02  | ..09.P........P.
0030: ff ff d1 29 00 00 44 65 66 61 75 6c 74 20 70 61  | ...)..Default pa
0040: 79 6c 6f 61 64 20 64 61 74 61                    | yload data

Total packet size: 74 bytes
======================================================================
```

## 🏗️ Project Structure

```
packet_generator/
├── packet_builder.py       # CLI main entry point
├── encapsulator.py         # PacketBuilder class (encapsulation)
├── visualizer.py           # Visualization and PCAP export
├── common/
│   ├── packet.py          # Packet data structure
│   └── utils.py           # Utility functions
└── layers/
    ├── ethernet.py        # Layer 2: Ethernet frames
    ├── ip.py             # Layer 3: IPv4 packets
    ├── tcp.py            # Layer 4: TCP segments
    ├── udp.py            # Layer 4: UDP datagrams
    └── icmp.py           # Layer 4: ICMP messages
```

## 🔬 Technical Details

### Checksum Calculations

#### IP Checksum (Header Only)
1. Sum all 16-bit words in header
2. Add carry bits
3. Take one's complement

#### TCP/UDP Checksum (With Pseudo-header)
1. Construct pseudo-header:
   - Source IP (4 bytes)
   - Destination IP (4 bytes)
   - Zero (1 byte)
   - Protocol (1 byte)
   - TCP/UDP Length (2 bytes)
2. Sum pseudo-header + header + data
3. Add carry bits
4. Take one's complement

#### ICMP Checksum (Message Only)
1. Sum all 16-bit words in ICMP message
2. Add carry bits
3. Take one's complement

### Binary Packing

Uses Python `struct` module:
- Network byte order: `!` (big-endian)
- Format codes:
  - `B`: unsigned char (1 byte)
  - `H`: unsigned short (2 bytes)
  - `I`: unsigned int (4 bytes)

### TCP Flags

```python
FLAG_FIN = 0x01  # Connection termination
FLAG_SYN = 0x02  # Connection initiation
FLAG_RST = 0x04  # Connection reset
FLAG_PSH = 0x08  # Push data
FLAG_ACK = 0x10  # Acknowledgment
FLAG_URG = 0x20  # Urgent data
FLAG_ECE = 0x40  # ECN Echo
FLAG_CWR = 0x80  # Congestion Window Reduced
FLAG_NS  = 0x100 # Nonce Sum
```

## 🧪 Testing

All protocols have been tested and verified:

```bash
# TCP tests
python3 packet_builder.py --protocol tcp --tcp-flags SYN --visualize
python3 packet_builder.py --protocol tcp --tcp-flags "SYN,ACK" --visualize

# UDP tests
python3 packet_builder.py --protocol udp --visualize

# ICMP tests
python3 packet_builder.py --protocol icmp --icmp-type 8 --visualize

# PCAP generation test
python3 packet_builder.py --protocol tcp --pcap test.pcap
wireshark test.pcap
```

## 📚 References

- [RFC 791 - Internet Protocol](https://tools.ietf.org/html/rfc791)
- [RFC 792 - Internet Control Message Protocol](https://tools.ietf.org/html/rfc792)
- [RFC 793 - Transmission Control Protocol](https://tools.ietf.org/html/rfc793)
- [RFC 768 - User Datagram Protocol](https://tools.ietf.org/html/rfc768)
- [IEEE 802.3 - Ethernet](https://standards.ieee.org/standard/802_3-2018.html)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## ✨ Highlights

- ✅ RFC-compliant implementation
- ✅ Independent layer configuration
- ✅ Accurate checksum calculations
- ✅ Wireshark-compatible PCAP files
- ✅ Detailed packet visualization
- ✅ Pure Python (no external dependencies)
- ✅ Suitable for education and testing

## ⚠️ Disclaimer

This tool is intended for educational and network testing purposes only. Sending packets to real networks requires proper authorization and permissions.

## 🛠️ Development

Built using:
- Python 3.6+ standard library
- `struct` module for binary packing
- `socket` module for network operations
- `argparse` for CLI interface

### Architecture

The packet builder uses a layered architecture following the OSI model:

1. **Encapsulation Layer** (`encapsulator.py`):
   - Fluent API for packet construction
   - Handles layer-by-layer encapsulation

2. **Protocol Layers** (`layers/`):
   - Each protocol implemented as a separate class
   - `to_bytes()` method for serialization
   - `from_bytes()` method for parsing

3. **Visualization** (`visualizer.py`):
   - Hexdump generation
   - Protocol field extraction
   - PCAP file format support

## 📖 Usage Examples

### Creating a TCP Three-Way Handshake

```bash
# Step 1: SYN
python3 packet_builder.py --protocol tcp --tcp-flags SYN --tcp-seq 1000 --pcap syn.pcap

# Step 2: SYN-ACK
python3 packet_builder.py --protocol tcp --tcp-flags "SYN,ACK" --tcp-seq 2000 --tcp-ack 1001 --pcap synack.pcap

# Step 3: ACK
python3 packet_builder.py --protocol tcp --tcp-flags ACK --tcp-seq 1001 --tcp-ack 2001 --pcap ack.pcap
```

### Creating a UDP Echo Request

```bash
python3 packet_builder.py --protocol udp \
    --udp-sport 7 --udp-dport 7 \
    --payload "Echo this!" \
    --pcap echo.pcap
```

### Creating an ICMP Destination Unreachable

```bash
python3 packet_builder.py --protocol icmp \
    --icmp-type 3 --icmp-code 1 \
    --payload "Port unreachable" \
    --pcap dest_unreachable.pcap
```

## 🎓 Educational Use

This tool is perfect for:
- Learning network protocols
- Understanding packet structure
- Testing network applications
- Studying OSI model encapsulation
- Preparing for network certifications (CCNA, Network+)

## 🔍 Troubleshooting

### Common Issues

**Q: My packet doesn't appear in Wireshark**
- Make sure you're using the correct network interface
- Check if the packet was saved to PCAP correctly
- Verify the EtherType and protocol fields

**Q: Checksum validation fails**
- Ensure you're using the correct source/destination IPs
- Check if pseudo-header is constructed properly
- Verify payload length calculations

**Q: Permission denied when running**
- No root permissions needed for packet construction
- Only visualization and PCAP export are supported
- Use separate tools (e.g., scapy) for actual transmission

## 🌐 Related Projects

- [Scapy](https://scapy.net/) - Powerful packet manipulation program
- [Wireshark](https://www.wireshark.org/) - Network protocol analyzer
- [tcpdump](https://www.tcpdump.org/) - Command-line packet analyzer

## 📮 Contact

For questions, issues, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for network enthusiasts and learners**
