# Packet Generator Project Documentation

## 프로젝트 개요
Linux CLI 기반 네트워크 패킷 생성 및 모니터링 도구
- **위치**: `/home/nmsglobal/DEVEL/packet_generator/`
- **언어**: Python 3 (표준 라이브러리만 사용)
- **아키텍처**: 클라이언트-서버 모델
- **개발 도구**: Zen MCP (설계), Serena MCP (구조 분석)

## 프로젝트 구조
```
packet_generator/
├── server.py          # 패킷 수신 서버 (8.7KB)
├── client.py          # 패킷 생성 클라이언트 (12KB)
├── common/
│   ├── __init__.py
│   ├── packet.py      # 패킷 데이터 구조 및 직렬화
│   └── utils.py       # 유틸리티 (컬러 출력, 통계, 로깅)
├── README.md          # 상세 사용 가이드 (7.5KB)
└── PROJECT_DOCUMENTATION.md  # 이 문서
```

## 주요 기능

### 서버 (server.py)
- **멀티스레드 TCP 소켓 서버**: 다중 클라이언트 동시 처리
- **실시간 컬러 출력**: 패킷 정보를 ANSI 컬러로 표시
- **패킷 타입별 색상 구분**:
  - TCP: 파란색 (`\033[94m`)
  - UDP: 시안색 (`\033[96m`)
  - ICMP: 노란색 (`\033[93m`)
  - HTTP: 녹색 (`\033[92m`)
- **통계 집계**: 패킷 수, 전송률, 처리량, 경과 시간
- **로그 파일 저장**: 선택적 파일 로깅
- **우아한 종료**: SIGINT/SIGTERM 처리

**CLI 옵션**:
```bash
--host HOST      # 바인딩 주소 (기본: 0.0.0.0)
--port PORT      # 포트 번호 (기본: 5555)
--log-file FILE  # 로그 파일 경로 (옵션)
```

### 클라이언트 (client.py)
- **4가지 패킷 타입**: TCP, UDP, ICMP, HTTP
- **전송 모드**:
  - **단일**: 1개 패킷 전송
  - **배치**: `--count`로 개수 지정
  - **연속**: `--continuous`로 무한 전송
  - **랜덤**: `--random`으로 랜덤 타입
- **커스터마이징**:
  - `--size`: 패킷 크기 (기본 64 바이트)
  - `--interval`: 전송 간격 (초 단위)
- **진행률 표시**: 프로그레스 바와 실시간 통계

**CLI 옵션**:
```bash
--server HOST    # 서버 주소 (기본: localhost)
--port PORT      # 서버 포트 (기본: 5555)
--type TYPE      # 패킷 타입 (TCP/UDP/ICMP/HTTP)
--count N        # 전송 패킷 수 (기본: 1)
--interval SEC   # 간격 초 (기본: 0)
--size BYTES     # 패킷 크기 (기본: 64)
--continuous     # 연속 전송 모드
--random         # 랜덤 타입 전송
```

## 패킷 구조 (common/packet.py)

### Packet 클래스
```python
class Packet:
    id: str              # UUID
    timestamp: str       # ISO8601
    packet_type: str     # TCP/UDP/ICMP/HTTP
    source_ip: str
    source_port: int
    dest_ip: str
    dest_port: int
    size: int           # 바이트
    payload: str        # 페이로드 데이터
    flags: List[str]    # 플래그 리스트
    ttl: int            # Time to live
    protocol: str       # 프로토콜 (IPv4)
    sequence: int       # 시퀀스 번호
```

### 메서드
- `to_dict()`: Packet → Dictionary
- `to_json()`: Packet → JSON 문자열
- `from_dict(data)`: Dictionary → Packet
- `from_json(json_str)`: JSON 문자열 → Packet
- `__str__()`: 사람이 읽을 수 있는 문자열
- `__repr__()`: 디버그용 표현

### 패킷 JSON 예제
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-10-13T00:38:26.123456Z",
  "type": "TCP",
  "source": {
    "ip": "192.168.1.100",
    "port": 43034
  },
  "destination": {
    "ip": "localhost",
    "port": 5555
  },
  "size": 64,
  "payload": "Data packet 0",
  "flags": ["RST", "FIN", "ACK"],
  "metadata": {
    "ttl": 64,
    "protocol": "IPv4",
    "sequence": 1
  }
}
```

## 유틸리티 (common/utils.py)

### Colors 클래스
ANSI 컬러 코드 정의:
- `HEADER`, `OKBLUE`, `OKCYAN`, `OKGREEN`
- `WARNING`, `FAIL`, `ENDC`, `BOLD`, `UNDERLINE`
- 패킷 타입별: `TCP`, `UDP`, `ICMP`, `HTTP`

### 출력 함수
```python
print_header(text)      # 헤더 출력 (굵은 글씨, 중앙 정렬)
print_info(text)        # 정보 메시지 (파란색)
print_success(text)     # 성공 메시지 (녹색)
print_warning(text)     # 경고 메시지 (노란색)
print_error(text)       # 오류 메시지 (빨간색)
colored(text, color)    # 컬러 텍스트 반환
```

### Statistics 클래스
통계 추적 및 계산:
```python
add_packet(size)        # 패킷 추가
get_rate()              # 초당 패킷 수
get_throughput()        # 초당 바이트
get_current_rate()      # 현재 전송률
get_summary()           # 통계 요약 문자열
reset()                 # 통계 초기화
```

### 유틸리티 함수
```python
get_timestamp()         # 현재 시각 문자열
format_bytes(n)         # 바이트를 KB/MB/GB로 변환
format_duration(sec)    # 초를 ms/s/m/h로 변환
progress_bar(cur, tot)  # 프로그레스 바 생성
```

### Logger 클래스
파일 기반 로깅:
```python
log(message)           # 일반 로그
log_packet(packet)     # 패킷 로그
log_error(error)       # 오류 로그
log_info(info)         # 정보 로그
```

## 통신 프로토콜

### 전송 계층
- **프로토콜**: TCP (신뢰성)
- **포맷**: JSON (UTF-8 인코딩)
- **메시지 구조**:
  1. 4바이트 길이 프리픽스 (big-endian)
  2. JSON 페이로드

### 송신 프로세스 (client.py)
```python
# 1. 패킷 직렬화
data = packet.to_json().encode('utf-8')
length = len(data)

# 2. 길이 전송 (4바이트)
socket.sendall(length.to_bytes(4, byteorder='big'))

# 3. 데이터 전송
socket.sendall(data)
```

### 수신 프로세스 (server.py)
```python
# 1. 길이 수신 (4바이트)
length_data = recv_exact(socket, 4)
msg_length = int.from_bytes(length_data, byteorder='big')

# 2. 데이터 수신
data = recv_exact(socket, msg_length)

# 3. 패킷 역직렬화
packet = Packet.from_json(data.decode('utf-8'))
```

### recv_exact() 함수
정확한 바이트 수를 수신하는 헬퍼 함수:
```python
def recv_exact(sock, num_bytes):
    data = b''
    while len(data) < num_bytes:
        chunk = sock.recv(num_bytes - len(data))
        if not chunk:
            return None
        data += chunk
    return data
```

## 사용 예제

### 기본 테스트
```bash
# 터미널 1: 서버 시작
python3 server.py

# 터미널 2: 테스트 패킷 전송
python3 client.py --type TCP --count 10
```

### 고부하 테스트
```bash
# 터미널 1: 서버 시작 (로깅 포함)
python3 server.py --log-file test.log

# 터미널 2: 대량 패킷 전송
python3 client.py --random --count 1000 --interval 0.01
```

### 다중 클라이언트 테스트
```bash
# 터미널 1: 서버
python3 server.py --port 5555

# 터미널 2-4: 클라이언트 3개 동시 실행
python3 client.py --type TCP --continuous --interval 0.5
python3 client.py --type UDP --continuous --interval 0.3
python3 client.py --random --count 100 --interval 0.1
```

### 특정 타입 테스트
```bash
# ICMP 핑 시뮬레이션
python3 client.py --type ICMP --count 20 --interval 1

# HTTP 요청 시뮬레이션
python3 client.py --type HTTP --count 50 --interval 0.2

# TCP 연결 시뮬레이션
python3 client.py --type TCP --count 100 --interval 0.1
```

### 원격 서버 테스트
```bash
# 원격 서버 연결
python3 client.py --server 192.168.1.100 --port 8888 --type TCP --count 50
```

## 실제 테스트 결과

### 테스트 1: TCP 배치
```bash
python3 client.py --type TCP --count 5 --interval 0.1
```
**결과**:
- 전송: 5개 패킷
- 전송률: 12.44 pkt/s
- 소요 시간: 0.40초
- 상태: 성공 ✓

### 테스트 2: UDP 배치
```bash
python3 client.py --type UDP --count 3
```
**결과**:
- 전송: 3개 패킷
- 전송률: 12029.55 pkt/s
- 소요 시간: 0.00초 (즉시)
- 상태: 성공 ✓

### 테스트 3: 랜덤 패킷
```bash
python3 client.py --random --count 5 --interval 0.05
```
**결과**:
- TCP: 1개
- UDP: 1개
- ICMP: 1개
- HTTP: 2개
- 총 데이터: 3.63 KB
- 전송률: 19.83 pkt/s
- 처리량: 14.40 KB/s
- 상태: 성공 ✓

### 서버 최종 통계
```
총 수신 패킷: 13개
총 데이터: 4.13 KB
평균 전송률: 0.22 pkt/s
평균 처리량: 70.43 B/s
실행 시간: 1분 0초
```

## 서버 출력 예제

```
======================================================================
                       PACKET GENERATOR SERVER
======================================================================

[SUCCESS] Server started on 0.0.0.0:5555
[INFO] Waiting for clients... (Press Ctrl+C to stop)

[SUCCESS] Client connected: 127.0.0.1:42476

2025-10-13 00:38:26 [TCP ] [127.0.0.1:42476] 192.168.1.100:43034 -> localhost:5555 | Size: 64B | Seq: #1 | Flags: [RST,FIN,ACK]
2025-10-13 00:38:26 [TCP ] [127.0.0.1:42476] 192.168.1.100:18979 -> localhost:5555 | Size: 64B | Seq: #2 | Flags: [ACK,SYN]
2025-10-13 00:38:42 [UDP ] [127.0.0.1:60438] 192.168.1.100:29552 -> localhost:5555 | Size: 64B | Seq: #1
2025-10-13 00:38:43 [HTTP] [127.0.0.1:60440] 192.168.1.100:15605 -> localhost:5555 | Size: 690B | Seq: #1 | Flags: [GET,200]
2025-10-13 00:38:43 [ICMP] [127.0.0.1:60440] 192.168.1.100:38315 -> localhost:5555 | Size: 932B | Seq: #3
```

## 핵심 클래스 및 메서드

### server.py - PacketServer
```python
class PacketServer:
    def __init__(host, port, log_file)
    def start()                    # 서버 시작
    def handle_client(socket, addr) # 클라이언트 핸들러 (스레드)
    def recv_exact(socket, bytes)   # 정확한 바이트 수신
    def display_packet(packet, id)  # 패킷 컬러 출력
    def stop()                      # 서버 종료
    def signal_handler(sig, frame)  # 시그널 처리
```

### client.py - PacketClient
```python
class PacketClient:
    def __init__(host, port)
    def connect()                   # 서버 연결
    def disconnect()                # 연결 해제
    def generate_packet(type, ...)  # 패킷 생성
    def send_packet(packet)         # 패킷 전송
    def send_single(type, size)     # 단일 전송
    def send_batch(type, count, ...)# 배치 전송
    def send_continuous(type, ...)  # 연속 전송
    def send_random(count, ...)     # 랜덤 전송
    def stop()                      # 클라이언트 종료
    def signal_handler(sig, frame)  # 시그널 처리
```

## 설계 원칙

### 1. 단순성
- 표준 라이브러리만 사용
- 외부 의존성 없음
- 명확한 코드 구조

### 2. 신뢰성
- TCP 프로토콜 사용
- 길이 프리픽스로 메시지 경계 명확화
- 모든 네트워크 오류 처리

### 3. 확장성
- 새 패킷 타입 추가 용이
- 모듈화된 구조
- 플러그인 방식으로 확장 가능

### 4. 사용성
- 컬러 출력으로 가독성 향상
- 직관적인 CLI 인터페이스
- 상세한 도움말 및 예제

### 5. 견고성
- 멀티스레딩으로 동시 처리
- 우아한 종료 처리
- 로깅 및 통계 기능

## 기술 스택

- **언어**: Python 3.6+
- **네트워킹**: socket (TCP)
- **직렬화**: json
- **CLI**: argparse
- **멀티스레딩**: threading
- **시그널 처리**: signal
- **시간**: time, datetime
- **고유 ID**: uuid

## 성능 특성

- **최대 전송률**: ~12,000 pkt/s (간격 없는 경우)
- **평균 전송률**: 10-20 pkt/s (0.1s 간격)
- **메모리 사용**: ~15 MB (서버)
- **CPU 사용**: 낮음 (대기 시)
- **동시 클라이언트**: 무제한 (스레드 기반)

## 제한사항

1. **실제 네트워크 패킷 아님**: 시뮬레이션만 수행
2. **Raw 소켓 미사용**: 실제 ICMP/UDP 전송 불가
3. **단일 서버**: 분산 서버 미지원
4. **메모리 제한**: 대량 로그 시 메모리 증가
5. **네트워크 지연**: 측정 불가

## 향후 개선 사항

### 기능 추가
- [ ] UDP 프로토콜 옵션
- [ ] 웹 대시보드 (실시간 그래프)
- [ ] 패킷 필터링 및 검색
- [ ] 데이터베이스 저장 (SQLite)
- [ ] pcap 파일 내보내기
- [ ] 패킷 재생 기능

### 성능 개선
- [ ] 비동기 I/O (asyncio)
- [ ] 패킷 버퍼링
- [ ] 압축 전송 (zlib)
- [ ] 배치 전송 최적화

### 사용성 개선
- [ ] TUI (Text UI)
- [ ] 설정 파일 지원
- [ ] 프리셋 저장/로드
- [ ] 자동 완성

## 문제 해결

### 포트 충돌
```bash
# 오류: Address already in use
# 해결: 다른 포트 사용
python3 server.py --port 6666
```

### 연결 실패
```bash
# 오류: Connection refused
# 확인: 서버 실행 여부
ps aux | grep server.py

# 확인: 포트 리스닝
netstat -tuln | grep 5555
```

### 권한 오류
```bash
# 해결: 실행 권한 부여
chmod +x server.py client.py
```

### 방화벽 문제
```bash
# 방화벽 상태 확인
sudo ufw status

# 포트 허용
sudo ufw allow 5555/tcp
```

## 라이선스
MIT License

## 개발 정보
- **개발 시작**: 2025-10-13
- **개발 도구**: Claude Code + Zen MCP + Serena MCP
- **테스트 환경**: WSL2 (Linux 5.15.167.4-microsoft-standard-WSL2)
- **Python 버전**: 3.12+
