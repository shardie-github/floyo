"""
API Client SDK examples and utilities.

Provides example code for integrating with the Floyo API in various languages.
"""

# Python SDK Example
PYTHON_SDK_EXAMPLE = """
# Floyo API Python Client Example

import requests
from typing import Optional, Dict, Any

class FloyoClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'X-API-Version': 'v1'
        })
    
    def _get_csrf_token(self) -> Optional[str]:
        '''Get CSRF token from cookies.'''
        response = self.session.get(f'{self.base_url}/api/v1/auth/me')
        return response.cookies.get('XSRF-TOKEN')
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        '''Make authenticated request with CSRF protection.'''
        # Add CSRF token for state-changing requests
        if method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            csrf_token = self._get_csrf_token()
            if csrf_token:
                self.session.headers['X-XSRF-TOKEN'] = csrf_token
        
        url = f'{self.base_url}{endpoint}'
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()
    
    def get_user(self) -> Dict[str, Any]:
        '''Get current user information.'''
        return self._request('GET', '/api/v1/auth/me')
    
    def create_event(self, event_type: str, **kwargs) -> Dict[str, Any]:
        '''Create a new event.'''
        return self._request('POST', '/api/v1/events', json={
            'event_type': event_type,
            **kwargs
        })
    
    def get_events(self, skip: int = 0, limit: int = 20) -> Dict[str, Any]:
        '''Get user events.'''
        return self._request('GET', '/api/v1/events', params={
            'skip': skip,
            'limit': limit
        })

# Usage
client = FloyoClient('https://api.floyo.com', 'your-api-key')
user = client.get_user()
events = client.get_events()
"""

# JavaScript/TypeScript SDK Example
JAVASCRIPT_SDK_EXAMPLE = """
// Floyo API JavaScript/TypeScript Client Example

class FloyoClient {
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.csrfToken = null;
  }

  private async getCsrfToken(): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
      credentials: 'include'
    });
    const cookies = response.headers.get('set-cookie');
    // Extract XSRF-TOKEN from cookies
    const match = cookies?.match(/XSRF-TOKEN=([^;]+)/);
    return match ? match[1] : null;
  }

  private async request(
    method: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      this.csrfToken = await this.getCsrfToken();
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-API-Version': 'v1',
      ...options.headers,
    };

    if (this.csrfToken) {
      headers['X-XSRF-TOKEN'] = this.csrfToken;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  async getUser(): Promise<any> {
    return this.request('GET', '/api/v1/auth/me');
  }

  async createEvent(eventType: string, data: any): Promise<any> {
    return this.request('POST', '/api/v1/events', {
      body: JSON.stringify({
        event_type: eventType,
        ...data,
      }),
    });
  }

  async getEvents(skip = 0, limit = 20): Promise<any> {
    return this.request('GET', `/api/v1/events?skip=${skip}&limit=${limit}`);
  }
}

// Usage
const client = new FloyoClient('https://api.floyo.com', 'your-api-key');
const user = await client.getUser();
const events = await client.getEvents();
"""

# cURL Examples
CURL_EXAMPLES = """
# Get CSRF Token
curl -X GET https://api.floyo.com/api/v1/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -c cookies.txt

# Create Event (with CSRF token)
curl -X POST https://api.floyo.com/api/v1/events \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "X-XSRF-TOKEN: $(grep XSRF-TOKEN cookies.txt | awk '{print $7}')" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Version: v1" \\
  -b cookies.txt \\
  -d '{
    "event_type": "file_opened",
    "file_path": "/path/to/file.txt"
  }'

# Get Events
curl -X GET "https://api.floyo.com/api/v1/events?skip=0&limit=20" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "X-API-Version: v1"
"""

# Error Handling Example
ERROR_HANDLING_EXAMPLE = """
# Python Error Handling Example

from backend.error_handling import APIError, ValidationError, NotFoundError

try:
    response = client.create_event("invalid")
except ValidationError as e:
    print(f"Validation error: {e.message}")
    print(f"Details: {e.details}")
except NotFoundError as e:
    print(f"Not found: {e.message}")
except APIError as e:
    print(f"API error: {e.message} (Code: {e.error_code})")
except Exception as e:
    print(f"Unexpected error: {e}")
"""

# Rate Limiting Example
RATE_LIMITING_EXAMPLE = """
# Python Rate Limiting Handling

import time
from requests.exceptions import HTTPError

def make_request_with_retry(client, endpoint, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client._request('GET', endpoint)
        except HTTPError as e:
            if e.response.status_code == 429:  # Rate limited
                retry_after = int(e.response.headers.get('Retry-After', 60))
                if attempt < max_retries - 1:
                    print(f"Rate limited. Retrying after {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
            raise
    raise Exception("Max retries exceeded")
"""

def generate_sdk_documentation() -> str:
    """
    Generate SDK documentation.
    
    Returns:
        str: Complete SDK documentation
    """
    return f"""
# Floyo API SDK Examples

## Python SDK

{PYTHON_SDK_EXAMPLE}

## JavaScript/TypeScript SDK

{JAVASCRIPT_SDK_EXAMPLE}

## cURL Examples

{CURL_EXAMPLES}

## Error Handling

{ERROR_HANDLING_EXAMPLE}

## Rate Limiting

{RATE_LIMITING_EXAMPLE}

## Response Format

All API responses follow this standardized format:

```json
{{
  "request_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "api_version": "v1",
  "data": {{ ... }},
  "metadata": {{
    "response_time_ms": 45.23,
    "environment": "production"
  }}
}}
```

## Authentication

1. Register/login to get access token
2. Include token in Authorization header: `Bearer <token>`
3. For state-changing requests, include CSRF token in `X-XSRF-TOKEN` header

## API Versioning

- Current version: v1
- Specify version in path: `/api/v1/...`
- Or use header: `X-API-Version: v1`
- Deprecated versions include deprecation warnings in headers
"""

if __name__ == "__main__":
    print(generate_sdk_documentation())
