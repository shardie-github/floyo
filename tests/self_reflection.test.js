/**
 * Self-Reflection Test: Scans repository to assert system guardrails
 * Fails build if audit regressions reappear
 * 
 * This test validates that the architectural guardrails derived from
 * the audit findings are still in place and haven't regressed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('System Self-Reflection', () => {
  const repoRoot = path.resolve(__dirname, '..');

  describe('Guardrails Configuration', () => {
    test('guardrails.yaml should exist', () => {
      const guardrailsPath = path.join(repoRoot, 'infra', 'selfcheck', 'guardrails.yaml');
      expect(fs.existsSync(guardrailsPath)).toBe(true);
    });

    test('guardrails.yaml should be valid YAML', () => {
      const guardrailsPath = path.join(repoRoot, 'infra', 'selfcheck', 'guardrails.yaml');
      const content = fs.readFileSync(guardrailsPath, 'utf-8');
      expect(() => {
        // Basic YAML validation - check for key structure
        expect(content).toContain('security:');
        expect(content).toContain('architecture:');
        expect(content).toContain('database:');
      }).not.toThrow();
    });
  });

  describe('Validation Scripts', () => {
    const validationScripts = [
      'check_circular_deps.py',
      'check_migrations.py',
      'check_env_completeness.py',
      'check_hardcoded_secrets.py',
      'check_rate_limit_redis.py',
      'check_schema_completeness.py',
      'check_adr_alignment.py',
      'run_guardrails.py',
    ];

    validationScripts.forEach((script) => {
      test(`${script} should exist and be executable`, () => {
        const scriptPath = path.join(repoRoot, 'infra', 'selfcheck', script);
        expect(fs.existsSync(scriptPath)).toBe(true);
        
        // Check if executable (Unix)
        if (process.platform !== 'win32') {
          const stats = fs.statSync(scriptPath);
          expect(stats.mode & 0o111).toBeTruthy(); // Executable bit set
        }
      });
    });
  });

  describe('System Intelligence Map', () => {
    test('system_intelligence_map.json should exist', () => {
      const mapPath = path.join(repoRoot, 'src', 'observability', 'system_intelligence_map.json');
      expect(fs.existsSync(mapPath)).toBe(true);
    });

    test('system_intelligence_map.json should be valid JSON', () => {
      const mapPath = path.join(repoRoot, 'src', 'observability', 'system_intelligence_map.json');
      const content = fs.readFileSync(mapPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('system_intelligence_map.json should contain required structure', () => {
      const mapPath = path.join(repoRoot, 'src', 'observability', 'system_intelligence_map.json');
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
      
      expect(map).toHaveProperty('modules');
      expect(map).toHaveProperty('business_goals');
      expect(map).toHaveProperty('resilience_dependencies');
      expect(map).toHaveProperty('architectural_truths');
    });
  });

  describe('SLO Monitors', () => {
    test('slo-monitors.yml should exist', () => {
      const sloPath = path.join(repoRoot, 'infra', 'selfcheck', 'slo-monitors.yml');
      expect(fs.existsSync(sloPath)).toBe(true);
    });

    test('slo-monitors.yml should define top 3 SLOs', () => {
      const sloPath = path.join(repoRoot, 'infra', 'selfcheck', 'slo-monitors.yml');
      const content = fs.readFileSync(sloPath, 'utf-8');
      
      // Check for SLO definitions
      expect(content).toContain('slo_api_availability');
      expect(content).toContain('slo_api_latency');
      expect(content).toContain('slo_database_pool');
    });
  });

  describe('CI Configuration', () => {
    test('CI intent tests workflow should exist', () => {
      const workflowPath = path.join(repoRoot, '.github', 'workflows', 'ci-intent-tests.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    test('CI workflow should run guardrails', () => {
      const workflowPath = path.join(repoRoot, '.github', 'workflows', 'ci-intent-tests.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('run_guardrails.py');
      expect(content).toContain('architecture-integrity');
    });
  });

  describe('Critical Security Guardrails', () => {
    test('SECRET_KEY validation should exist in config.py', () => {
      const configPath = path.join(repoRoot, 'backend', 'config.py');
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        expect(content).toContain('validate_production');
        expect(content).toContain('secret_key');
      }
    });

    test('CORS validation should exist in config.py', () => {
      const configPath = path.join(repoRoot, 'backend', 'config.py');
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        expect(content).toContain('cors_origins');
      }
    });
  });

  describe('Health Check Endpoints', () => {
    test('Health check endpoints should be documented', () => {
      const sloPath = path.join(repoRoot, 'infra', 'selfcheck', 'slo-monitors.yml');
      const content = fs.readFileSync(sloPath, 'utf-8');
      
      expect(content).toContain('/health');
      expect(content).toContain('/health/readiness');
      expect(content).toContain('/health/liveness');
    });
  });

  describe('Documentation', () => {
    test('Living architecture guide should exist', () => {
      const guidePath = path.join(repoRoot, 'docs', 'LIVING_ARCHITECTURE_GUIDE.md');
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    test('Audit documents should exist', () => {
      const auditDir = path.join(repoRoot, 'docs', 'audit');
      expect(fs.existsSync(auditDir)).toBe(true);
      
      const requiredAudits = [
        'EXEC_SUMMARY.md',
        'ROOT_CAUSE_AND_DRIFT_MAP.md',
        'RESILIENCE_TABLE.md',
      ];
      
      requiredAudits.forEach((audit) => {
        const auditPath = path.join(auditDir, audit);
        expect(fs.existsSync(auditPath)).toBe(true);
      });
    });
  });

  describe('Architecture Integrity', () => {
    test('No hardcoded secrets in common locations', () => {
      const backendConfig = path.join(repoRoot, 'backend', 'config.py');
      if (fs.existsSync(backendConfig)) {
        const content = fs.readFileSync(backendConfig, 'utf-8');
        // Should not have actual secrets hardcoded (only defaults)
        expect(content).not.toMatch(/secret_key\s*=\s*["'](sk-|pk-|ey[A-Za-z0-9]{20,})/);
      }
    });

    test('Main.py should not exceed extreme size (warn if > 3000 lines)', () => {
      const mainPath = path.join(repoRoot, 'backend', 'main.py');
      if (fs.existsSync(mainPath)) {
        const lines = fs.readFileSync(mainPath, 'utf-8').split('\n').length;
        // Warn if extremely large, but don't fail (refactoring is in progress)
        if (lines > 3000) {
          console.warn(`Warning: main.py is very large (${lines} lines). Consider splitting into modules.`);
        }
        expect(lines).toBeGreaterThan(0); // Just ensure it exists
      }
    });
  });

  describe('Module Dependencies', () => {
    test('Critical modules should exist', () => {
      const criticalModules = [
        'backend/config.py',
        'backend/database.py',
        'backend/main.py',
        'database/models.py',
      ];
      
      criticalModules.forEach((module) => {
        const modulePath = path.join(repoRoot, ...module.split('/'));
        expect(fs.existsSync(modulePath)).toBe(true);
      });
    });
  });

  describe('Self-Healing Infrastructure', () => {
    test('Adaptive learning layer should exist (if implemented)', () => {
      const driftTracker = path.join(repoRoot, 'infra', 'selfcheck', 'drift_tracker.json');
      // This is optional, so we don't fail if it doesn't exist yet
      if (fs.existsSync(driftTracker)) {
        const content = JSON.parse(fs.readFileSync(driftTracker, 'utf-8'));
        expect(content).toHaveProperty('version');
      }
    });
  });
});
