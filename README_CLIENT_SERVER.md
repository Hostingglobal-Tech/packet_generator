# Packet Generator

Linux CLI 기반 네트워크 패킷 생성 및 모니터링 도구입니다. 클라이언트-서버 아키텍처로 구현되어 있으며, 다양한 타입의 네트워크 패킷을 생성하고 실시간으로 모니터링할 수 있습니다.

## 특징

- **다양한 패킷 타입 지원**: TCP, UDP, ICMP, HTTP 시뮬레이션
- **실시간 모니터링**: 컬러 출력으로 패킷 정보를 실시간 표시
- **멀티 클라이언트 지원**: 여러 클라이언트의 동시 접속 처리
- **통계 정보**: 패킷 수, 전송률, 처리량 등 실시간 통계
- **로깅**: 파일 기반 패킷 로깅 (옵션)
- **유연한 CLI**: 다양한 전송 모드 및 옵션

## 시스템 요구사항

- Python 3.6 이상
- Linux 환경 (WSL 포함)
- 네트워크 접근 권한

## 프로젝트 구조

```
packet_generator/
├── client.py          # 패킷 생성 및 전송 클라이언트
├── server.py          # 패킷 수신 및 표시 서버
├── common/
│   ├── __init__.py
│   ├── packet.py      # 패킷 데이터 구조
│   └── utils.py       # 유틸리티 함수
└── README.md
```

## 설치

별도의 설치 과정이 필요 없습니다. Python 3 표준 라이브러리만 사용합니다.

```bash
# 실행 권한 부여
chmod +x server.py client.py
```

## 사용법

### 1. 서버 시작

```bash
# 기본 포트(5555)로 서버 시작
python3 server.py

# 특정 포트 지정
python3 server.py --port 8888

# 로그 파일과 함께 시작
python3 server.py --port 5555 --log-file packets.log

# 모든 인터페이스에서 수신
python3 server.py --host 0.0.0.0 --port 5555
```

**서버 옵션:**
- `--host`: 바인딩할 호스트 주소 (기본값: 0.0.0.0)
- `--port`: 리스닝 포트 번호 (기본값: 5555)
- `--log-file`: 패킷 로그 파일 경로 (옵션)

### 2. 클라이언트 실행

#### 단일 패킷 전송

```bash
# TCP 패킷 1개 전송
python3 client.py --type TCP

# UDP 패킷 1개 전송
python3 client.py --type UDP

# 큰 사이즈 ICMP 패킷 전송
python3 client.py --type ICMP --size 1024
```

#### 배치 전송

```bash
# TCP 패킷 100개 전송
python3 client.py --type TCP --count 100

# 0.1초 간격으로 UDP 패킷 50개 전송
python3 client.py --type UDP --count 50 --interval 0.1

# HTTP 패킷 200개를 0.05초 간격으로 전송
python3 client.py --type HTTP --count 200 --interval 0.05
```

#### 연속 전송

```bash
# 1초 간격으로 ICMP 패킷 연속 전송 (Ctrl+C로 중지)
python3 client.py --type ICMP --continuous --interval 1

# 0.5초 간격으로 TCP 패킷 연속 전송
python3 client.py --type TCP --continuous --interval 0.5
```

#### 랜덤 패킷 전송

```bash
# 랜덤 타입 패킷 100개 전송
python3 client.py --random --count 100

# 0.2초 간격으로 랜덤 패킷 50개 전송
python3 client.py --random --count 50 --interval 0.2
```

#### 원격 서버 연결

```bash
# 원격 서버에 연결
python3 client.py --server 192.168.1.100 --port 8888 --type TCP --count 50
```

**클라이언트 옵션:**
- `--server`: 서버 주소 (기본값: localhost)
- `--port`: 서버 포트 (기본값: 5555)
- `--type`: 패킷 타입 (TCP, UDP, ICMP, HTTP)
- `--count`: 전송할 패킷 수 (기본값: 1)
- `--interval`: 패킷 간 간격(초) (기본값: 0)
- `--size`: 패킷 크기(바이트) (기본값: 64)
- `--continuous`: 연속 전송 모드
- `--random`: 랜덤 패킷 타입 전송

## 사용 예제

### 예제 1: 기본 테스트

```bash
# 터미널 1: 서버 시작
python3 server.py

# 터미널 2: 테스트 패킷 전송
python3 client.py --type TCP --count 10
```

### 예제 2: 고부하 테스트

```bash
# 터미널 1: 서버 시작 (로깅 포함)
python3 server.py --log-file test.log

# 터미널 2: 대량 패킷 전송
python3 client.py --random --count 1000 --interval 0.01
```

### 예제 3: 다중 클라이언트 테스트

```bash
# 터미널 1: 서버 시작
python3 server.py --port 5555

# 터미널 2: 클라이언트 1
python3 client.py --type TCP --continuous --interval 0.5

# 터미널 3: 클라이언트 2
python3 client.py --type UDP --continuous --interval 0.3

# 터미널 4: 클라이언트 3
python3 client.py --random --count 100 --interval 0.1
```

### 예제 4: 특정 패킷 타입 테스트

```bash
# ICMP 핑 시뮬레이션
python3 client.py --type ICMP --count 20 --interval 1

# HTTP 요청 시뮬레이션
python3 client.py --type HTTP --count 50 --interval 0.2

# TCP 연결 시뮬레이션
python3 client.py --type TCP --count 100 --interval 0.1
```

## 패킷 구조

생성되는 패킷은 다음과 같은 JSON 구조를 가집니다:

```json
{
  "id": "UUID",
  "timestamp": "2025-01-13T12:00:00.000Z",
  "type": "TCP",
  "source": {
    "ip": "192.168.1.100",
    "port": 54321
  },
  "destination": {
    "ip": "localhost",
    "port": 5555
  },
  "size": 64,
  "payload": "Data packet 1",
  "flags": ["SYN", "ACK"],
  "metadata": {
    "ttl": 64,
    "protocol": "IPv4",
    "sequence": 1
  }
}
```

## 출력 예제

### 서버 출력 (컬러)

```
======================================================================
            PACKET GENERATOR SERVER
======================================================================

[SUCCESS] Server started on 0.0.0.0:5555
[INFO] Waiting for clients... (Press Ctrl+C to stop)

[SUCCESS] Client connected: 127.0.0.1:45678

2025-01-13 12:00:00 [TCP ] [127.0.0.1:45678] 192.168.1.100:54321 -> localhost:5555 | Size: 64B | Seq: #1 | Flags: [SYN,ACK]
2025-01-13 12:00:01 [UDP ] [127.0.0.1:45678] 192.168.1.100:54322 -> localhost:5555 | Size: 128B | Seq: #2
2025-01-13 12:00:02 [ICMP] [127.0.0.1:45678] 192.168.1.100:54323 -> localhost:5555 | Size: 64B | Seq: #3 | Payload: Echo Request

[INFO] Stats: Packets: 100 | Data: 6.40 KB | Rate: 50.00 pkt/s | Throughput: 3.20 KB/s | Duration: 2.00s
```

### 클라이언트 출력

```
======================================================================
            SENDING BATCH: 100 PACKETS
======================================================================

[INFO] Type: TCP | Size: 64B | Interval: 0.1s
[========================================] 100.0% (100/100) | Sent: 100 | Rate: 9.5 pkt/s

======================================================================
            BATCH COMPLETE
======================================================================

[SUCCESS] Sent: 100 packets
[INFO] Duration: 10.53s | Rate: 9.50 pkt/s
```

## 통계 정보

- **Packets**: 전송/수신된 총 패킷 수
- **Data**: 전송/수신된 총 데이터 양
- **Rate**: 초당 패킷 수 (pkt/s)
- **Throughput**: 초당 데이터 처리량 (bytes/s)
- **Duration**: 경과 시간

## 종료

- 서버/클라이언트 모두 `Ctrl+C`로 우아하게 종료됩니다
- 종료 시 최종 통계가 표시됩니다
- 로그 파일이 지정된 경우 자동으로 저장됩니다

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 다른 포트 사용
python3 server.py --port 6666
python3 client.py --port 6666 --type TCP
```

### 서버 연결 실패

```bash
# 서버가 실행 중인지 확인
ps aux | grep server.py

# 방화벽 설정 확인
sudo ufw status

# 포트 리스닝 확인
netstat -tuln | grep 5555
```

### 권한 오류

```bash
# 실행 권한 부여
chmod +x server.py client.py

# Python 경로 확인
which python3
```

## 개발 정보

- **언어**: Python 3
- **네트워킹**: socket (TCP)
- **멀티스레딩**: threading
- **직렬화**: JSON
- **CLI**: argparse

## 라이선스

MIT License

## 제작자

Linux CLI 기반 패킷 생성 및 모니터링 도구
