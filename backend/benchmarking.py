"""
Performance benchmarking utilities.

Provides tools for benchmarking API endpoints, database queries, and cache operations.
"""

import time
import statistics
from typing import Dict, List, Any, Callable, Optional
from functools import wraps
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class BenchmarkResult:
    """Result of a benchmark run."""
    
    def __init__(
        self,
        name: str,
        iterations: int,
        total_time: float,
        min_time: float,
        max_time: float,
        mean_time: float,
        median_time: float,
        p95_time: float,
        p99_time: float,
        errors: int = 0
    ):
        self.name = name
        self.iterations = iterations
        self.total_time = total_time
        self.min_time = min_time
        self.max_time = max_time
        self.mean_time = mean_time
        self.median_time = median_time
        self.p95_time = p95_time
        self.p99_time = p99_time
        self.errors = errors
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "iterations": self.iterations,
            "total_time_ms": round(self.total_time * 1000, 2),
            "min_time_ms": round(self.min_time * 1000, 2),
            "max_time_ms": round(self.max_time * 1000, 2),
            "mean_time_ms": round(self.mean_time * 1000, 2),
            "median_time_ms": round(self.median_time * 1000, 2),
            "p95_time_ms": round(self.p95_time * 1000, 2),
            "p99_time_ms": round(self.p99_time * 1000, 2),
            "errors": self.errors,
            "timestamp": self.timestamp.isoformat(),
        }
    
    def __str__(self) -> str:
        return f"Benchmark {self.name}: {self.mean_time*1000:.2f}ms (p95: {self.p95_time*1000:.2f}ms)"


def benchmark(
    func: Callable,
    iterations: int = 100,
    warmup: int = 10,
    name: Optional[str] = None
) -> BenchmarkResult:
    """
    Benchmark a function.
    
    Args:
        func: Function to benchmark
        iterations: Number of iterations
        warmup: Number of warmup iterations
        name: Benchmark name (defaults to function name)
        
    Returns:
        BenchmarkResult: Benchmark results
    """
    name = name or func.__name__
    times = []
    errors = 0
    
    # Warmup
    for _ in range(warmup):
        try:
            func()
        except Exception:
            pass
    
    # Benchmark
    for _ in range(iterations):
        start = time.perf_counter()
        try:
            func()
        except Exception as e:
            errors += 1
            logger.warning(f"Error in benchmark {name}: {e}")
        finally:
            elapsed = time.perf_counter() - start
            times.append(elapsed)
    
    if not times:
        raise ValueError("No successful iterations")
    
    times.sort()
    total_time = sum(times)
    
    return BenchmarkResult(
        name=name,
        iterations=iterations,
        total_time=total_time,
        min_time=min(times),
        max_time=max(times),
        mean_time=statistics.mean(times),
        median_time=statistics.median(times),
        p95_time=times[int(len(times) * 0.95)] if len(times) > 1 else times[0],
        p99_time=times[int(len(times) * 0.99)] if len(times) > 1 else times[-1],
        errors=errors
    )


def benchmark_endpoint(
    client,
    method: str,
    path: str,
    iterations: int = 100,
    **kwargs
) -> BenchmarkResult:
    """
    Benchmark an API endpoint.
    
    Args:
        client: TestClient or similar
        method: HTTP method (GET, POST, etc.)
        path: Endpoint path
        iterations: Number of iterations
        **kwargs: Additional arguments for request
        
    Returns:
        BenchmarkResult: Benchmark results
    """
    def make_request():
        getattr(client, method.lower())(path, **kwargs)
    
    return benchmark(make_request, iterations=iterations, name=f"{method} {path}")


def compare_benchmarks(results: List[BenchmarkResult]) -> Dict[str, Any]:
    """
    Compare multiple benchmark results.
    
    Args:
        results: List of benchmark results
        
    Returns:
        Dict[str, Any]: Comparison results
    """
    if not results:
        return {}
    
    fastest = min(results, key=lambda r: r.mean_time)
    slowest = max(results, key=lambda r: r.mean_time)
    
    comparison = {
        "fastest": fastest.to_dict(),
        "slowest": slowest.to_dict(),
        "comparison": {}
    }
    
    baseline = results[0]
    for result in results[1:]:
        speedup = baseline.mean_time / result.mean_time
        comparison["comparison"][result.name] = {
            "speedup": round(speedup, 2),
            "slower_by": round((result.mean_time - baseline.mean_time) * 1000, 2),
            "slower_by_percent": round(((result.mean_time / baseline.mean_time) - 1) * 100, 2),
        }
    
    return comparison


def benchmark_decorator(iterations: int = 100):
    """
    Decorator to benchmark a function.
    
    Usage:
        @benchmark_decorator(iterations=1000)
        def my_function():
            # Your code
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = benchmark(
                lambda: func(*args, **kwargs),
                iterations=iterations,
                name=func.__name__
            )
            logger.info(str(result))
            return func(*args, **kwargs)
        return wrapper
    return decorator


def load_test_endpoint(
    client,
    method: str,
    path: str,
    concurrent_users: int = 10,
    requests_per_user: int = 10,
    **kwargs
) -> Dict[str, Any]:
    """
    Load test an endpoint with concurrent users.
    
    Args:
        client: TestClient or similar
        method: HTTP method
        path: Endpoint path
        concurrent_users: Number of concurrent users
        requests_per_user: Requests per user
        **kwargs: Additional request arguments
        
    Returns:
        Dict[str, Any]: Load test results
    """
    import concurrent.futures
    
    def make_requests():
        times = []
        errors = 0
        for _ in range(requests_per_user):
            start = time.perf_counter()
            try:
                getattr(client, method.lower())(path, **kwargs)
            except Exception:
                errors += 1
            finally:
                times.append(time.perf_counter() - start)
        return times, errors
    
    all_times = []
    total_errors = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
        futures = [executor.submit(make_requests) for _ in range(concurrent_users)]
        for future in concurrent.futures.as_completed(futures):
            times, errors = future.result()
            all_times.extend(times)
            total_errors += errors
    
    if not all_times:
        return {"error": "No successful requests"}
    
    all_times.sort()
    
    return {
        "concurrent_users": concurrent_users,
        "requests_per_user": requests_per_user,
        "total_requests": concurrent_users * requests_per_user,
        "total_errors": total_errors,
        "error_rate": round(total_errors / (concurrent_users * requests_per_user) * 100, 2),
        "mean_response_time_ms": round(statistics.mean(all_times) * 1000, 2),
        "median_response_time_ms": round(statistics.median(all_times) * 1000, 2),
        "p95_response_time_ms": round(all_times[int(len(all_times) * 0.95)] * 1000, 2),
        "p99_response_time_ms": round(all_times[int(len(all_times) * 0.99)] * 1000, 2),
        "min_response_time_ms": round(min(all_times) * 1000, 2),
        "max_response_time_ms": round(max(all_times) * 1000, 2),
        "requests_per_second": round((concurrent_users * requests_per_user) / sum(all_times), 2),
    }
