/**
 * Form Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Form, FormInput, FormTextarea, FormSelect, FormCheckbox, FormSwitch } from '@/components/ui/form';

interface TestFormData {
  name: string;
  email: string;
  description: string;
  role: string;
  agree: boolean;
  enabled: boolean;
}

function TestForm() {
  const form = useForm<TestFormData>({
    defaultValues: {
      name: '',
      email: '',
      description: '',
      role: '',
      agree: false,
      enabled: false,
    },
  });

  const onSubmit = async (data: TestFormData) => {
    console.log('Submitted:', data);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormInput
        form={form}
        name="name"
        label="Name"
        required
      />
      <FormTextarea
        form={form}
        name="description"
        label="Description"
      />
      <FormSelect
        form={form}
        name="role"
        label="Role"
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
        ]}
      />
      <FormCheckbox
        form={form}
        name="agree"
        label="I agree"
      />
      <FormSwitch
        form={form}
        name="enabled"
        label="Enable"
      />
      <button type="submit">Submit</button>
    </Form>
  );
}

describe('Form Components', () => {
  it('renders form inputs', () => {
    render(<TestForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('submits form data', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    await user.type(screen.getByLabelText(/name/i), 'Test User');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test User');
    });
  });
});
