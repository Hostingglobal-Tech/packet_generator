# 패킷 생성기 (Packet Generator)

Linux CLI 기반의 네트워크 패킷 생성 및 분석 도구입니다. RFC 표준을 준수하는 실제 네트워크 패킷을 레이어별로 구성하고, 시각화하며, PCAP 파일로 저장할 수 있습니다.

## 🌟 주요 기능

### 1. 레이어별 패킷 구성 (OSI 모델)
- **Layer 2 (Ethernet)**: MAC 주소, EtherType, FCS
- **Layer 3 (IPv4)**: IP 헤더, 체크섬 계산
- **Layer 4**:
  - **TCP**: SYN/ACK/FIN 플래그, 시퀀스 번호, pseudo-header 체크섬
  - **UDP**: 간단한 데이터그램 전송
  - **ICMP**: Echo Request/Reply (ping)

### 2. 패킷 캡슐화
```
Application Payload → TCP/UDP/ICMP → IPv4 → Ethernet
```

### 3. 시각화 도구
- **Hexdump**: 16진수 덤프와 ASCII 표현
- **레이어 분석**: 각 프로토콜 필드 상세 표시
- **PCAP 내보내기**: Wireshark 호환 파일 생성

## 📦 설치

```bash
git clone https://github.com/yourusername/packet_generator.git
cd packet_generator
```

필요한 패키지가 없습니다. Python 3.6+ 표준 라이브러리만 사용합니다.

## 🚀 빠른 시작

### TCP SYN 패킷 생성
```bash
python3 packet_builder.py --protocol tcp --tcp-flags SYN --visualize
```

### UDP DNS 쿼리
```bash
python3 packet_builder.py --protocol udp \
    --udp-sport 53 --udp-dport 53 \
    --payload "DNS Query" --visualize
```

### ICMP Ping
```bash
python3 packet_builder.py --protocol icmp \
    --icmp-type 8 --ip-dst 8.8.8.8 \
    --visualize --pcap ping.pcap
```

### TCP SYN+ACK (PCAP 저장)
```bash
python3 packet_builder.py --protocol tcp \
    --tcp-flags "SYN,ACK" \
    --tcp-seq 1000 --tcp-ack 500 \
    --pcap output.pcap
```

## 📋 CLI 옵션

### 프로토콜
- `--protocol {tcp,udp,icmp}` - 전송 계층 프로토콜 선택

### Ethernet 레이어
- `--eth-src MAC` - 송신지 MAC 주소 (기본값: 00:11:22:33:44:55)
- `--eth-dst MAC` - 목적지 MAC 주소 (기본값: ff:ff:ff:ff:ff:ff)

### IP 레이어
- `--ip-src IP` - 송신지 IP 주소 (기본값: 192.168.1.100)
- `--ip-dst IP` - 목적지 IP 주소 (기본값: 192.168.1.1)
- `--ip-ttl N` - TTL 값 (기본값: 64)
- `--ip-id N` - Identification 필드 (기본값: 54321)

### TCP 옵션
- `--tcp-sport PORT` - 송신 포트 (기본값: 12345)
- `--tcp-dport PORT` - 목적지 포트 (기본값: 80)
- `--tcp-seq N` - 시퀀스 번호 (기본값: 0)
- `--tcp-ack N` - 확인 응답 번호 (기본값: 0)
- `--tcp-flags FLAGS` - TCP 플래그 (예: "SYN", "SYN,ACK", "PSH,ACK")
- `--tcp-window N` - 윈도우 크기 (기본값: 65535)

### UDP 옵션
- `--udp-sport PORT` - 송신 포트 (기본값: 12345)
- `--udp-dport PORT` - 목적지 포트 (기본값: 53)

### ICMP 옵션
- `--icmp-type TYPE` - ICMP 타입 (8=Echo Request, 0=Echo Reply)
- `--icmp-code CODE` - ICMP 코드 (기본값: 0)
- `--icmp-id N` - 식별자 (기본값: 1)
- `--icmp-seq N` - 시퀀스 번호 (기본값: 1)

### 페이로드 및 출력
- `--payload TEXT` - 애플리케이션 데이터
- `--visualize` - 패킷 구조 상세 표시
- `--hexdump` - 16진수 덤프만 표시
- `--output FILE` - 원시 바이너리 파일로 저장
- `--pcap FILE` - PCAP 파일로 저장 (Wireshark 호환)

## 📊 출력 예제

### TCP SYN 패킷 시각화

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

## 🏗️ 프로젝트 구조

```
packet_generator/
├── packet_builder.py       # CLI 메인 진입점
├── encapsulator.py         # PacketBuilder 클래스 (캡슐화)
├── visualizer.py           # 시각화 및 PCAP 내보내기
├── common/
│   ├── packet.py          # 패킷 데이터 구조
│   └── utils.py           # 유틸리티 함수
└── layers/
    ├── ethernet.py        # Layer 2: Ethernet 프레임
    ├── ip.py             # Layer 3: IPv4 패킷
    ├── tcp.py            # Layer 4: TCP 세그먼트
    ├── udp.py            # Layer 4: UDP 데이터그램
    └── icmp.py           # Layer 4: ICMP 메시지
```

## 🔬 기술 세부사항

### 체크섬 계산

#### IP 체크섬 (헤더만)
1. 헤더의 모든 16비트 워드를 합산
2. 캐리 비트를 더함
3. 1의 보수 취함

#### TCP/UDP 체크섬 (Pseudo-header 포함)
1. Pseudo-header 구성:
   - Source IP (4 bytes)
   - Destination IP (4 bytes)
   - Zero (1 byte)
   - Protocol (1 byte)
   - TCP/UDP Length (2 bytes)
2. Pseudo-header + 헤더 + 데이터를 합산
3. 캐리 비트를 더함
4. 1의 보수 취함

#### ICMP 체크섬 (메시지만)
1. ICMP 메시지의 모든 16비트 워드를 합산
2. 캐리 비트를 더함
3. 1의 보수 취함

### 바이너리 패킹

Python `struct` 모듈 사용:
- 네트워크 바이트 순서: `!` (빅 엔디안)
- 포맷 코드:
  - `B`: unsigned char (1 byte)
  - `H`: unsigned short (2 bytes)
  - `I`: unsigned int (4 bytes)

### TCP 플래그

```python
FLAG_FIN = 0x01  # 연결 종료
FLAG_SYN = 0x02  # 연결 시작
FLAG_RST = 0x04  # 연결 재설정
FLAG_PSH = 0x08  # 데이터 푸시
FLAG_ACK = 0x10  # 확인 응답
FLAG_URG = 0x20  # 긴급 데이터
FLAG_ECE = 0x40  # ECN Echo
FLAG_CWR = 0x80  # Congestion Window Reduced
FLAG_NS  = 0x100 # Nonce Sum
```

## 🧪 테스트

모든 프로토콜이 테스트되었으며 정상 작동합니다:

```bash
# TCP 테스트
python3 packet_builder.py --protocol tcp --tcp-flags SYN --visualize
python3 packet_builder.py --protocol tcp --tcp-flags "SYN,ACK" --visualize

# UDP 테스트
python3 packet_builder.py --protocol udp --visualize

# ICMP 테스트
python3 packet_builder.py --protocol icmp --icmp-type 8 --visualize

# PCAP 생성 테스트
python3 packet_builder.py --protocol tcp --pcap test.pcap
wireshark test.pcap
```

## 📚 참고 자료

- [RFC 791 - Internet Protocol](https://tools.ietf.org/html/rfc791)
- [RFC 792 - Internet Control Message Protocol](https://tools.ietf.org/html/rfc792)
- [RFC 793 - Transmission Control Protocol](https://tools.ietf.org/html/rfc793)
- [RFC 768 - User Datagram Protocol](https://tools.ietf.org/html/rfc768)
- [IEEE 802.3 - Ethernet](https://standards.ieee.org/standard/802_3-2018.html)

## 🤝 기여

기여는 환영합니다! Pull Request를 보내주세요.

## 📄 라이센스

MIT License

## ✨ 특징

- ✅ RFC 표준 준수
- ✅ 레이어별 독립적 구성
- ✅ 정확한 체크섬 계산
- ✅ Wireshark 호환 PCAP 파일
- ✅ 상세한 패킷 시각화
- ✅ 순수 Python (외부 의존성 없음)
- ✅ 교육용 및 테스트용으로 적합

## ⚠️ 주의사항

이 도구는 교육 및 네트워크 테스트 목적으로만 사용하세요. 실제 네트워크에 패킷을 전송하려면 적절한 권한과 승인이 필요합니다.
