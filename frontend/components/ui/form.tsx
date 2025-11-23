/**
 * Form Components
 * 
 * Form components with validation support.
 */

'use client';

import * as React from 'react';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { cn } from '@/lib/utils';

interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function Form<T extends FieldValues>({ form, onSubmit, children, className }: FormProps<T>) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      {children}
    </form>
  );
}

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required,
  children,
  className,
}: FormFieldProps<T>) {
  const error = form.formState.errors[name];
  
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name as string} className={required ? 'after:content-["*"] after:ml-0.5 after:text-destructive' : ''}>
          {label}
        </Label>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}

interface FormInputProps<T extends FieldValues> extends Omit<React.ComponentProps<typeof Input>, 'name'> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required,
  ...props
}: FormInputProps<T>) {
  return (
    <FormField form={form} name={name} label={label} description={description} required={required}>
      <Input
        {...props}
        {...form.register(name)}
        id={name as string}
        aria-invalid={form.formState.errors[name] ? 'true' : 'false'}
      />
    </FormField>
  );
}

interface FormTextareaProps<T extends FieldValues> extends Omit<React.ComponentProps<typeof Textarea>, 'name'> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormTextarea<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required,
  ...props
}: FormTextareaProps<T>) {
  return (
    <FormField form={form} name={name} label={label} description={description} required={required}>
      <Textarea
        {...props}
        {...form.register(name)}
        id={name as string}
        aria-invalid={form.formState.errors[name] ? 'true' : 'false'}
      />
    </FormField>
  );
}

interface FormSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function FormSelect<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required,
  options,
  placeholder,
}: FormSelectProps<T>) {
  return (
    <FormField form={form} name={name} label={label} description={description} required={required}>
      <Select
        value={form.watch(name) as string}
        onValueChange={(value) => form.setValue(name, value as any)}
      >
        <SelectTrigger id={name as string}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

interface FormCheckboxProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
}

export function FormCheckbox<T extends FieldValues>({
  form,
  name,
  label,
  description,
}: FormCheckboxProps<T>) {
  return (
    <FormField form={form} name={name} label={label} description={description}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name as string}
          checked={form.watch(name) as boolean}
          onCheckedChange={(checked) => form.setValue(name, checked as any)}
        />
        {label && <Label htmlFor={name as string}>{label}</Label>}
      </div>
    </FormField>
  );
}

interface FormSwitchProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
}

export function FormSwitch<T extends FieldValues>({
  form,
  name,
  label,
  description,
}: FormSwitchProps<T>) {
  return (
    <FormField form={form} name={name} label={label} description={description}>
      <div className="flex items-center space-x-2">
        <Switch
          id={name as string}
          checked={form.watch(name) as boolean}
          onCheckedChange={(checked) => form.setValue(name, checked as any)}
        />
        {label && <Label htmlFor={name as string}>{label}</Label>}
      </div>
    </FormField>
  );
}
