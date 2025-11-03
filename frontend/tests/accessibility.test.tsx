/**
 * Accessibility tests using Axe Core.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Dashboard from '../components/Dashboard';
import LoginForm from '../components/LoginForm';
import EventsList from '../components/EventsList';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('Dashboard should have no accessibility violations', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LoginForm should have no accessibility violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('EventsList should have no accessibility violations', async () => {
    const { container } = render(<EventsList events={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('All interactive elements should be keyboard accessible', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container, {
      rules: {
        'keyboard-navigation': { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('Images should have alt text', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container, {
      rules: {
        'image-alt': { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('Form inputs should have labels', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container, {
      rules: {
        'label': { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
