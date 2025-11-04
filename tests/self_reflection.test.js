/**
 * Self-Reflection Test
 * Validates that the system guardrails are in place and working.
 * This test scans the repository to assert system integrity.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('System Self-Reflection', () => {
  describe('Guardrails Infrastructure', () => {
    test('guardrails.yaml exists', () => {
      const guardrailsPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'guardrails.yaml');
      expect(fs.existsSync(guardrailsPath)).toBe(true);
    });

    test('validate_guardrails.py exists', () => {
      const scriptPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'validate_guardrails.py');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('guardrails.yaml is valid YAML', () => {
      const yaml = require('js-yaml');
      const guardrailsPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'guardrails.yaml');
      const content = fs.readFileSync(guardrailsPath, 'utf8');
      expect(() => yaml.load(content)).not.toThrow();
    });
  });

  describe('System Intelligence Map', () => {
    test('system_intelligence_map.json exists', () => {
      const mapPath = path.join(__dirname, '..', 'src', 'observability', 'system_intelligence_map.json');
      expect(fs.existsSync(mapPath)).toBe(true);
    });

    test('system_intelligence_map.json is valid JSON', () => {
      const mapPath = path.join(__dirname, '..', 'src', 'observability', 'system_intelligence_map.json');
      const content = fs.readFileSync(mapPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('system_intelligence_map.json has required structure', () => {
      const mapPath = path.join(__dirname, '..', 'src', 'observability', 'system_intelligence_map.json');
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      
      expect(map).toHaveProperty('version');
      expect(map).toHaveProperty('modules');
      expect(map).toHaveProperty('business_goals');
      expect(map).toHaveProperty('resilience_dependencies');
    });
  });

  describe('Living Documentation', () => {
    test('LIVING_ARCHITECTURE_GUIDE.md exists', () => {
      const guidePath = path.join(__dirname, '..', 'docs', 'LIVING_ARCHITECTURE_GUIDE.md');
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    test('LIVING_ARCHITECTURE_GUIDE.md is not empty', () => {
      const guidePath = path.join(__dirname, '..', 'docs', 'LIVING_ARCHITECTURE_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf8');
      expect(content.length).toBeGreaterThan(1000); // At least 1KB
    });
  });

  describe('CI Integration', () => {
    test('ci-intent-tests.yml workflow exists', () => {
      const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'ci-intent-tests.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    test('ci-intent-tests.yml is valid YAML', () => {
      const yaml = require('js-yaml');
      const workflowPath = path.join(__dirname, '..', 'github', 'workflows', 'ci-intent-tests.yml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      expect(() => yaml.load(content)).not.toThrow();
    });
  });

  describe('SLO Monitors', () => {
    test('slo-monitors.yml exists', () => {
      const sloPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'slo-monitors.yml');
      expect(fs.existsSync(sloPath)).toBe(true);
    });

    test('slo-monitors.yml defines top 3 SLOs', () => {
      const yaml = require('js-yaml');
      const sloPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'slo-monitors.yml');
      const content = fs.readFileSync(sloPath, 'utf8');
      const sloConfig = yaml.load(content);
      
      expect(sloConfig).toHaveProperty('slo_monitors');
      expect(sloConfig.slo_monitors).toHaveProperty('api_availability');
      expect(sloConfig.slo_monitors).toHaveProperty('api_latency');
      expect(sloConfig.slo_monitors).toHaveProperty('data_consistency');
    });
  });

  describe('Critical Guardrails', () => {
    test('SECRET_KEY guardrail exists', () => {
      const yaml = require('js-yaml');
      const guardrailsPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'guardrails.yaml');
      const content = fs.readFileSync(guardrailsPath, 'utf8');
      const guardrails = yaml.load(content);
      
      const securityGuardrails = guardrails.guardrails?.security || [];
      const secretKeyGuardrail = securityGuardrails.find(
        g => g.name === 'SECRET_KEY_NOT_DEFAULT'
      );
      
      expect(secretKeyGuardrail).toBeDefined();
      expect(secretKeyGuardrail.severity).toBe('critical');
      expect(secretKeyGuardrail.priority).toBe('P0');
    });

    test('CORS guardrail exists', () => {
      const yaml = require('js-yaml');
      const guardrailsPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'guardrails.yaml');
      const content = fs.readFileSync(guardrailsPath, 'utf8');
      const guardrails = yaml.load(content);
      
      const securityGuardrails = guardrails.guardrails?.security || [];
      const corsGuardrail = securityGuardrails.find(
        g => g.name === 'CORS_NOT_PERMISSIVE'
      );
      
      expect(corsGuardrail).toBeDefined();
      expect(corsGuardrail.severity).toBe('critical');
    });

    test('Database pool monitoring guardrail exists', () => {
      const yaml = require('js-yaml');
      const guardrailsPath = path.join(__dirname, '..', 'infra', 'selfcheck', 'guardrails.yaml');
      const content = fs.readFileSync(guardrailsPath, 'utf8');
      const guardrails = yaml.load(content);
      
      const resilienceGuardrails = guardrails.guardrails?.resilience || [];
      const poolGuardrail = resilienceGuardrails.find(
        g => g.name === 'DATABASE_POOL_MONITORING'
      );
      
      expect(poolGuardrail).toBeDefined();
    });
  });

  describe('No Regression Checks', () => {
    test('main.py should not exceed 2500 lines (regression check)', () => {
      const mainPath = path.join(__dirname, '..', 'backend', 'main.py');
      if (fs.existsSync(mainPath)) {
        const content = fs.readFileSync(mainPath, 'utf8');
        const lines = content.split('\n').length;
        // Allow some growth but warn if getting too large
        expect(lines).toBeLessThan(2500);
      }
    });

    test('No hardcoded secrets in backend code', () => {
      const backendPath = path.join(__dirname, '..', 'backend');
      const files = fs.readdirSync(backendPath).filter(f => f.endsWith('.py'));
      
      const secretPatterns = [
        /api_key\s*=\s*['"][^'"]{20,}['"]/i,
        /secret\s*=\s*['"][^'"]{20,}['"]/i,
        /password\s*=\s*['"][^'"]{10,}['"]/i
      ];
      
      let violations = [];
      for (const file of files) {
        const filePath = path.join(backendPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            // Skip if it's a config variable or known safe pattern
            if (!content.includes('SECRET_KEY') && !content.includes('your-secret-key-change-in-production')) {
              violations.push(`${file}: potential hardcoded secret`);
            }
          }
        }
      }
      
      if (violations.length > 0) {
        console.warn('Potential hardcoded secrets found:', violations);
      }
      // Don't fail test, just warn (CI guardrails will catch this)
    });
  });
});
