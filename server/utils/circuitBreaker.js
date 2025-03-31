/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping operations when a service is failing
 */

const STATE = {
  CLOSED: 'CLOSED',      // Circuit is closed, operations proceed normally
  OPEN: 'OPEN',         // Circuit is open, operations fail fast
  HALF_OPEN: 'HALF_OPEN' // Circuit is testing if service has recovered
};

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.halfOpenTimeout = options.halfOpenTimeout || 30000; // 30 seconds
    this.monitorInterval = options.monitorInterval || 10000; // 10 seconds

    this.state = STATE.CLOSED;
    this.failures = 0;
    this.lastFailureTime = null;
    this.monitors = new Set();
    this.serviceHealthChecks = new Map();

    this.startMonitoring();
  }

  async executeFunction(func, fallback = null) {
    if (this.state === STATE.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = STATE.HALF_OPEN;
      } else {
        return fallback ? await fallback() : this.handleOpenCircuit();
      }
    }

    try {
      const result = await func();
      this.handleSuccess();
      return result;
    } catch (error) {
      return this.handleFailure(error, fallback);
    }
  }

  async handleFailure(error, fallback) {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === STATE.HALF_OPEN || this.failures >= this.failureThreshold) {
      this.state = STATE.OPEN;
      this.notifyMonitors('CIRCUIT_OPENED', { failures: this.failures, error });
    }

    if (fallback) {
      return await fallback();
    }
    throw error;
  }

  handleSuccess() {
    if (this.state === STATE.HALF_OPEN) {
      this.reset();
      this.notifyMonitors('CIRCUIT_CLOSED', { message: 'Service recovered' });
    }
    this.failures = 0;
  }

  shouldAttemptReset() {
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  handleOpenCircuit() {
    throw new Error('Circuit breaker is OPEN - Service unavailable');
  }

  reset() {
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.lastFailureTime = null;
  }

  addMonitor(callback) {
    this.monitors.add(callback);
    return () => this.monitors.delete(callback);
  }

  notifyMonitors(event, data) {
    this.monitors.forEach(monitor => {
      try {
        monitor(event, { ...data, state: this.state, timestamp: new Date() });
      } catch (error) {
        console.error('Error in circuit breaker monitor:', error);
      }
    });
  }

  addHealthCheck(serviceName, checkFunction) {
    this.serviceHealthChecks.set(serviceName, checkFunction);
  }

  startMonitoring() {
    setInterval(async () => {
      if (this.state === STATE.OPEN && this.shouldAttemptReset()) {
        this.state = STATE.HALF_OPEN;
        this.notifyMonitors('CIRCUIT_HALF_OPEN', { message: 'Attempting service recovery' });
      }

      // Run health checks
      for (const [service, check] of this.serviceHealthChecks) {
        try {
          const isHealthy = await check();
          if (!isHealthy && this.state === STATE.CLOSED) {
            this.failures++;
            this.notifyMonitors('SERVICE_UNHEALTHY', { service });
          }
        } catch (error) {
          console.error(`Health check failed for ${service}:`, error);
        }
      }
    }, this.monitorInterval);
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime,
      isOpen: this.state === STATE.OPEN,
      isHalfOpen: this.state === STATE.HALF_OPEN,
      isClosed: this.state === STATE.CLOSED
    };
  }
}

// Create circuit breakers for different services
export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000
});

export const authCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
});

export const quoteServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 4,
  resetTimeout: 45000
});

export default CircuitBreaker; 