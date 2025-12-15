#!/usr/bin/env python3
"""
Utility functions for packet generator.
Includes logging, formatting, and helper functions.
"""

import sys
import time
from datetime import datetime
from typing import Optional


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

    # Packet type colors
    TCP = '\033[94m'      # Blue
    UDP = '\033[96m'      # Cyan
    ICMP = '\033[93m'     # Yellow
    HTTP = '\033[92m'     # Green


def colored(text: str, color: str) -> str:
    """Return colored text for terminal output"""
    return f"{color}{text}{Colors.ENDC}"


def print_colored(text: str, color: str, end: str = '\n'):
    """Print colored text to terminal"""
    print(colored(text, color), end=end)


def print_header(text: str):
    """Print header with formatting"""
    print("\n" + "=" * 70)
    print_colored(text.center(70), Colors.BOLD)
    print("=" * 70 + "\n")


def print_info(text: str):
    """Print info message"""
    print_colored(f"[INFO] {text}", Colors.OKBLUE)


def print_success(text: str):
    """Print success message"""
    print_colored(f"[SUCCESS] {text}", Colors.OKGREEN)


def print_warning(text: str):
    """Print warning message"""
    print_colored(f"[WARNING] {text}", Colors.WARNING)


def print_error(text: str):
    """Print error message"""
    print_colored(f"[ERROR] {text}", Colors.FAIL)


def get_timestamp() -> str:
    """Get current timestamp as formatted string"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def format_bytes(num_bytes: int) -> str:
    """Format bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if num_bytes < 1024.0:
            return f"{num_bytes:.2f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.2f} TB"


def format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable format"""
    if seconds < 1:
        return f"{seconds*1000:.2f}ms"
    elif seconds < 60:
        return f"{seconds:.2f}s"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        secs = seconds % 60
        return f"{minutes}m {secs:.0f}s"
    else:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"


class Statistics:
    """Simple statistics tracker"""

    def __init__(self):
        self.total_count = 0
        self.total_bytes = 0
        self.start_time = time.time()
        self.last_count = 0
        self.last_time = time.time()

    def add_packet(self, size: int):
        """Add a packet to statistics"""
        self.total_count += 1
        self.total_bytes += size

    def get_rate(self) -> float:
        """Get packets per second rate"""
        elapsed = time.time() - self.start_time
        if elapsed == 0:
            return 0
        return self.total_count / elapsed

    def get_throughput(self) -> float:
        """Get bytes per second throughput"""
        elapsed = time.time() - self.start_time
        if elapsed == 0:
            return 0
        return self.total_bytes / elapsed

    def get_current_rate(self) -> float:
        """Get current packets per second rate (since last call)"""
        current_time = time.time()
        elapsed = current_time - self.last_time
        if elapsed == 0:
            return 0

        count_diff = self.total_count - self.last_count
        rate = count_diff / elapsed

        self.last_count = self.total_count
        self.last_time = current_time

        return rate

    def get_summary(self) -> str:
        """Get statistics summary as formatted string"""
        elapsed = time.time() - self.start_time
        rate = self.get_rate()
        throughput = self.get_throughput()

        return (
            f"Packets: {self.total_count} | "
            f"Data: {format_bytes(self.total_bytes)} | "
            f"Rate: {rate:.2f} pkt/s | "
            f"Throughput: {format_bytes(throughput)}/s | "
            f"Duration: {format_duration(elapsed)}"
        )

    def reset(self):
        """Reset statistics"""
        self.total_count = 0
        self.total_bytes = 0
        self.start_time = time.time()
        self.last_count = 0
        self.last_time = time.time()


def progress_bar(current: int, total: int, width: int = 50) -> str:
    """Generate a progress bar string"""
    if total == 0:
        return "[" + "=" * width + "]"

    progress = current / total
    filled = int(width * progress)
    bar = "=" * filled + "-" * (width - filled)
    percentage = progress * 100

    return f"[{bar}] {percentage:.1f}% ({current}/{total})"


class Logger:
    """Simple file logger"""

    def __init__(self, log_file: Optional[str] = None):
        self.log_file = log_file
        self.enabled = log_file is not None

    def log(self, message: str):
        """Write log message to file"""
        if not self.enabled:
            return

        try:
            timestamp = get_timestamp()
            with open(self.log_file, 'a') as f:
                f.write(f"[{timestamp}] {message}\n")
        except Exception as e:
            print_error(f"Failed to write log: {e}")

    def log_packet(self, packet_str: str):
        """Log packet information"""
        self.log(f"PACKET: {packet_str}")

    def log_error(self, error: str):
        """Log error message"""
        self.log(f"ERROR: {error}")

    def log_info(self, info: str):
        """Log info message"""
        self.log(f"INFO: {info}")
