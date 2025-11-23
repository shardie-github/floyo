#!/usr/bin/env python3
"""
Performance benchmarking script for Floyo API.

Measures response times, throughput, and resource usage for critical endpoints.
"""

import asyncio
import time
import statistics
from typing import List, Dict
import aiohttp
import argparse
from dataclasses import dataclass
from datetime import datetime

@dataclass
class BenchmarkResult:
    """Result of a single benchmark run."""
    endpoint: str
    method: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    total_time: float
    avg_response_time: float
    median_response_time: float
    p95_response_time: float
    p99_response_time: float
    min_response_time: float
    max_response_time: float
    requests_per_second: float
    errors: List[str]


async def make_request(session: aiohttp.ClientSession, url: str, method: str = "GET", **kwargs) -> tuple[float, bool, str]:
    """Make a single HTTP request and return timing and result."""
    start_time = time.time()
    error = None
    success = False
    
    try:
        async with session.request(method, url, **kwargs) as response:
            await response.read()
            success = response.status < 400
            if not success:
                error = f"HTTP {response.status}"
    except Exception as e:
        error = str(e)
    
    elapsed = time.time() - start_time
    return elapsed, success, error


async def benchmark_endpoint(
    base_url: str,
    endpoint: str,
    method: str = "GET",
    num_requests: int = 100,
    concurrency: int = 10,
    **request_kwargs
) -> BenchmarkResult:
    """Benchmark a single endpoint."""
    url = f"{base_url}{endpoint}"
    response_times: List[float] = []
    errors: List[str] = []
    successful = 0
    failed = 0
    
    connector = aiohttp.TCPConnector(limit=concurrency)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Create semaphore to limit concurrency
        semaphore = asyncio.Semaphore(concurrency)
        
        async def bounded_request():
            async with semaphore:
                elapsed, success, error = await make_request(session, url, method, **request_kwargs)
                response_times.append(elapsed)
                if success:
                    successful += 1
                else:
                    failed += 1
                    if error:
                        errors.append(error)
        
        start_time = time.time()
        tasks = [bounded_request() for _ in range(num_requests)]
        await asyncio.gather(*tasks)
        total_time = time.time() - start_time
    
    if not response_times:
        return BenchmarkResult(
            endpoint=endpoint,
            method=method,
            total_requests=num_requests,
            successful_requests=0,
            failed_requests=num_requests,
            total_time=total_time,
            avg_response_time=0,
            median_response_time=0,
            p95_response_time=0,
            p99_response_time=0,
            min_response_time=0,
            max_response_time=0,
            requests_per_second=0,
            errors=errors
        )
    
    response_times.sort()
    n = len(response_times)
    
    return BenchmarkResult(
        endpoint=endpoint,
        method=method,
        total_requests=num_requests,
        successful_requests=successful,
        failed_requests=failed,
        total_time=total_time,
        avg_response_time=statistics.mean(response_times),
        median_response_time=statistics.median(response_times),
        p95_response_time=response_times[int(n * 0.95)] if n > 0 else 0,
        p99_response_time=response_times[int(n * 0.99)] if n > 0 else 0,
        min_response_time=min(response_times),
        max_response_time=max(response_times),
        requests_per_second=num_requests / total_time if total_time > 0 else 0,
        errors=list(set(errors))[:10]  # Limit to 10 unique errors
    )


def print_results(results: List[BenchmarkResult]):
    """Print benchmark results in a formatted table."""
    print("\n" + "="*100)
    print("BENCHMARK RESULTS")
    print("="*100)
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z\n")
    
    for result in results:
        print(f"\n{result.method} {result.endpoint}")
        print("-" * 100)
        print(f"Total Requests:     {result.total_requests}")
        print(f"Successful:         {result.successful_requests} ({result.successful_requests/result.total_requests*100:.1f}%)")
        print(f"Failed:              {result.failed_requests} ({result.failed_requests/result.total_requests*100:.1f}%)")
        print(f"Total Time:          {result.total_time:.2f}s")
        print(f"Requests/Second:     {result.requests_per_second:.2f}")
        print(f"\nResponse Times (ms):")
        print(f"  Average:           {result.avg_response_time*1000:.2f}ms")
        print(f"  Median:            {result.median_response_time*1000:.2f}ms")
        print(f"  P95:               {result.p95_response_time*1000:.2f}ms")
        print(f"  P99:               {result.p99_response_time*1000:.2f}ms")
        print(f"  Min:               {result.min_response_time*1000:.2f}ms")
        print(f"  Max:               {result.max_response_time*1000:.2f}ms")
        
        if result.errors:
            print(f"\nErrors:")
            for error in result.errors[:5]:
                print(f"  - {error}")
            if len(result.errors) > 5:
                print(f"  ... and {len(result.errors) - 5} more")


async def main():
    parser = argparse.ArgumentParser(description="Benchmark Floyo API endpoints")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base URL of the API")
    parser.add_argument("--endpoints", nargs="+", default=["/health", "/api/health/readiness"], help="Endpoints to benchmark")
    parser.add_argument("--requests", type=int, default=100, help="Number of requests per endpoint")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent requests")
    parser.add_argument("--method", default="GET", help="HTTP method")
    
    args = parser.parse_args()
    
    print(f"Benchmarking {len(args.endpoints)} endpoint(s)")
    print(f"Base URL: {args.base_url}")
    print(f"Requests per endpoint: {args.requests}")
    print(f"Concurrency: {args.concurrency}")
    print(f"Method: {args.method}")
    
    results: List[BenchmarkResult] = []
    
    for endpoint in args.endpoints:
        print(f"\nBenchmarking {endpoint}...")
        result = await benchmark_endpoint(
            args.base_url,
            endpoint,
            method=args.method,
            num_requests=args.requests,
            concurrency=args.concurrency
        )
        results.append(result)
    
    print_results(results)
    
    # Summary
    print("\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    avg_rps = statistics.mean([r.requests_per_second for r in results])
    avg_latency = statistics.mean([r.avg_response_time for r in results])
    print(f"Average Requests/Second: {avg_rps:.2f}")
    print(f"Average Latency:         {avg_latency*1000:.2f}ms")


if __name__ == "__main__":
    asyncio.run(main())
