/**
 * API Client with Performance Monitoring
 * 
 * Wraps API calls with performance monitoring.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { performanceMonitor } from '../monitoring/performance';

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for performance monitoring
    this.client.interceptors.request.use(
      (config) => {
        // Store start time
        (config as any).__startTime = performance.now();
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for performance monitoring
    this.client.interceptors.response.use(
      (response) => {
        const config = response.config as any;
        const duration = performance.now() - (config.__startTime || 0);
        
        performanceMonitor.record(`api-${config.method}-${config.url}`, duration, {
          status: response.status,
          statusText: response.statusText,
        });

        return response;
      },
      (error) => {
        const config = error.config as any;
        if (config) {
          const duration = performance.now() - (config.__startTime || 0);
          
          performanceMonitor.record(`api-${config.method}-${config.url}`, duration, {
            error: true,
            status: error.response?.status,
          });
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.measure(`api-get-${url}`, () => this.client.get<T>(url, config));
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return performanceMonitor.measure(`api-post-${url}`, () =>
      this.client.post<T>(url, data, config)
    );
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return performanceMonitor.measure(`api-put-${url}`, () =>
      this.client.put<T>(url, data, config)
    );
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.measure(`api-delete-${url}`, () =>
      this.client.delete<T>(url, config)
    );
  }
}

// Export singleton instance
export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
);
