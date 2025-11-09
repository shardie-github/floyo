#!/usr/bin/env node
/**
 * Experiment Tracking Script
 * Tracks experiment progress and updates CSV
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const experimentsFile = path.join(__dirname, '..', 'ops', 'experiments.csv');
const resultsFile = path.join(__dirname, '..', 'ops', 'experiment-results.json');

function loadExperiments() {
  if (!fs.existsSync(experimentsFile)) {
    return [];
  }
  
  const content = fs.readFileSync(experimentsFile, 'utf-8');
  return csv.parse(content, {
    columns: true,
    skip_empty_lines: true,
  });
}

function saveExperiments(experiments) {
  const output = stringify(experiments, {
    header: true,
    columns: ['name', 'hypothesis', 'metric', 'owner', 'start', 'end', 'guardrails', 'rollback'],
  });
  fs.writeFileSync(experimentsFile, output);
}

function loadResults() {
  if (!fs.existsSync(resultsFile)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
}

function saveResults(results) {
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
}

function updateExperimentStatus(name, status, value) {
  const experiments = loadExperiments();
  const results = loadResults();
  
  const experiment = experiments.find(e => e.name === name);
  if (!experiment) {
    console.error(`Experiment "${name}" not found`);
    process.exit(1);
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  if (!results[name]) {
    results[name] = {
      startDate: experiment.start,
      endDate: experiment.end,
      status: 'running',
      measurements: [],
    };
  }
  
  results[name].status = status;
  results[name].lastUpdated = today;
  
  if (value !== undefined) {
    results[name].measurements.push({
      date: today,
      value: parseFloat(value),
    });
  }
  
  saveResults(results);
  console.log(`✅ Updated experiment "${name}": ${status}${value !== undefined ? ` (value: ${value})` : ''}`);
}

function showStatus() {
  const experiments = loadExperiments();
  const results = loadResults();
  
  console.log('\n📊 Experiment Status\n');
  console.log('='.repeat(80));
  
  for (const exp of experiments) {
    const result = results[exp.name] || {};
    const today = new Date().toISOString().split('T')[0];
    const isActive = today >= exp.start && today <= exp.end;
    
    console.log(`\n${exp.name}:`);
    console.log(`  Status: ${result.status || (isActive ? 'running' : 'not started')}`);
    console.log(`  Period: ${exp.start} to ${exp.end}`);
    console.log(`  Metric: ${exp.metric}`);
    console.log(`  Owner: ${exp.owner}`);
    
    if (result.measurements && result.measurements.length > 0) {
      const latest = result.measurements[result.measurements.length - 1];
      console.log(`  Latest Value: ${latest.value} (${latest.date})`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

// CLI
const command = process.argv[2];
const name = process.argv[3];
const value = process.argv[4];

switch (command) {
  case 'update':
    if (!name || !value) {
      console.error('Usage: node track-experiment.js update <name> <value>');
      process.exit(1);
    }
    updateExperimentStatus(name, 'running', value);
    break;
    
  case 'complete':
    if (!name) {
      console.error('Usage: node track-experiment.js complete <name>');
      process.exit(1);
    }
    updateExperimentStatus(name, 'completed');
    break;
    
  case 'status':
    showStatus();
    break;
    
  default:
    console.log('Usage:');
    console.log('  node track-experiment.js update <name> <value>  - Update experiment measurement');
    console.log('  node track-experiment.js complete <name>        - Mark experiment as complete');
    console.log('  node track-experiment.js status                 - Show all experiment statuses');
    process.exit(1);
}
