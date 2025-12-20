import { useState, useCallback, useMemo, useEffect } from "react"
import { validateField as baseValidateField, ValidationRule, ValidationResult } from '@/shared/lib/validation'

interface FormField<T = any> {
  value: T
  rules: ValidationRule<T>
  error?: string
}

interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T
  validationRules: { [K in keyof T]: ValidationRule<T[K]> }
  onSubmit?: (values: T) => void | Promise<void>
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormValidationOptions<T>) {
  // Use 'any' for the internal state to avoid complex TS mapping issues with generics
  const [fields, setFields] = useState<Record<string, FormField<any>>>(() => {
    const initialFields: Record<string, FormField<any>> = {}
    for (const key in initialValues) {
      if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
        initialFields[key] = {
          value: initialValues[key],
          rules: validationRules[key],
        }
      }
    }
    return initialFields
  })

  // Update fields when initialValues or validationRules change
  // This is critical for async data (like available shares) to propagate to validation rules
  useEffect(() => {
    setFields((prev) => {
      const next: Record<string, FormField<any>> = {}
      for (const key in initialValues) {
        if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
          next[key] = {
            value: prev[key]?.value ?? initialValues[key], // Keep existing value or use new initial
            rules: validationRules[key], // Always use new rules
            error: prev[key]?.error, // Keep existing error
          }
        }
      }
      return next
    })
  }, [initialValues, validationRules])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name: keyof T): ValidationResult => {
    const key = name as string
    const field = fields[key]
    if (!field) return { isValid: true }

    const result = baseValidateField(field.value, field.rules)

    setFields(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error: result.error,
      },
    }))

    return result
  }, [fields])

  const validateAll = useCallback((): boolean => {
    let isValid = true

    for (const key in fields) {
      const result = validateField(key as keyof T)
      if (!result.isValid) {
        isValid = false
      }
    }

    return isValid
  }, [fields, validateField])

  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    const key = name as string
    setFields(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
        error: undefined, // Clear error when value changes
      },
    }))
  }, [])

  const setValues = useCallback((values: Partial<T>) => {
    setFields(prev => {
      const newFields = { ...prev }
      for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
          const fieldKey = key as string
          newFields[fieldKey] = {
            ...newFields[fieldKey],
            value: values[key]!,
            error: undefined,
          }
        }
      }
      return newFields
    })
  }, [])

  const getValues = useCallback((): T => {
    const values = {} as T
    for (const key in fields) {
      values[key as keyof T] = fields[key].value
    }
    return values
  }, [fields])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!validateAll()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit?.(getValues())
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateAll, onSubmit, getValues])

  const reset = useCallback(() => {
    const resetFields: Record<string, FormField<any>> = {}
    for (const key in initialValues) {
      if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
        resetFields[key] = {
          value: initialValues[key],
          rules: validationRules[key],
        }
      }
    }
    setFields(resetFields)
    setIsSubmitting(false)
  }, [initialValues, validationRules])

  const hasErrors = useMemo(() => Object.values(fields).some(field => field.error), [fields])
  const isValid = !hasErrors
  const values = useMemo(() => getValues(), [getValues])

  // Cast fields back to the typed version for the return value
  const typedFields = fields as unknown as Record<keyof T, FormField<T[keyof T]>>

  return useMemo(() => ({
    fields: typedFields,
    values,
    setValue,
    setValues,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    isValid,
    hasErrors,
    isSubmitting,
  }), [
    typedFields,
    values,
    setValue,
    setValues,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    isValid,
    hasErrors,
    isSubmitting
  ])
}